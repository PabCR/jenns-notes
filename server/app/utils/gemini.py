"""Gemini AI client configuration and prompt engineering."""
import os
import logging
from google import genai
from google.genai import types
from app.schemas.gemini import ResourceMetadata

logger = logging.getLogger(__name__)


def get_gemini_client() -> genai.Client:
    """Create and return Gemini client.
    
    Returns:
        Initialized Gemini client
        
    Raises:
        ValueError: If GEMINI_API_KEY is not set in environment
    """
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        raise ValueError("GEMINI_API_KEY must be set in environment variables")
    
    return genai.Client(api_key=api_key)


def build_oncology_prompt(content: str) -> str:
    """Build oncology-focused prompt for structured metadata extraction.
    
    Args:
        content: Extracted text content from resource
    
    Returns:
        Formatted prompt string
    """
    prompt = f"""
You are an expert oncology nurse assistant helping to categorize and tag educational resources for cancer patients and their caregivers.

Analyze the following resource content and extract structured metadata:

{content}

Please provide:
1. **Tags** (5-8 tags): Relevant keywords for oncology nursing resources. Examples include:
   - Cancer types: breast cancer, lung cancer, leukemia, lymphoma, etc.
   - Treatments: chemotherapy, radiation therapy, immunotherapy, surgery, etc.
   - Side effects: nausea, fatigue, hair loss, neuropathy, etc.
   - Topics: nutrition, pain management, emotional support, caregiving, etc.
   - Patient education: medication instructions, symptom management, etc.

2. **Description** (1-2 sentences): A patient-friendly summary of what this resource covers. Use clear, non-technical language when possible. Use grade school level language and avoid using complex words, and describe as if the nurse is talking to a patient.

3. **Condition** (if applicable): The specific cancer type or medical condition this resource addresses (e.g., "breast cancer", "lung cancer", "general oncology").

4. **Audience**: Who this resource is intended for (e.g., "patients", "nurses", "caregivers", "family members").

5. **Topic**: The primary topic or category (e.g., "treatment options", "side effect management", "nutrition", "emotional support", "medication guide").

Focus on oncology nursing context and ensure tags are relevant and useful for organizing educational resources for cancer patients and their support network.

Use grade school level language and avoid using complex words. 
"""
    return prompt


def _validate_inputs(content: str | None, pdf_bytes: bytes | None) -> None:
    if not content and not pdf_bytes:
        raise ValueError("Either content or pdf_bytes must be provided")
    if content and pdf_bytes:
        raise ValueError("Cannot provide both content and pdf_bytes")
    if content is not None and not content.strip():
        raise ValueError("Content cannot be empty")


def _generate_with_pdf(client: genai.Client, pdf_bytes: bytes) -> ResourceMetadata:
    pdf_part = types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf")
    prompt = build_oncology_prompt("")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[pdf_part, prompt],
        config={
            "response_mime_type": "application/json",
            "response_json_schema": ResourceMetadata.model_json_schema(),
        },
    )
    return ResourceMetadata.model_validate_json(response.text)


def _generate_with_text(client: genai.Client, content: str) -> ResourceMetadata:
    prompt = build_oncology_prompt(content)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_json_schema": ResourceMetadata.model_json_schema(),
        },
    )
    return ResourceMetadata.model_validate_json(response.text)


def generate_resource_metadata(content: str = None, pdf_bytes: bytes = None) -> ResourceMetadata:
    """Generate structured metadata from resource content using Gemini AI."""
    _validate_inputs(content, pdf_bytes)

    try:
        client = get_gemini_client()
        if pdf_bytes:
            return _generate_with_pdf(client, pdf_bytes)
        return _generate_with_text(client, content or "")
    except Exception as e:  # pylint: disable=broad-except
        logger.error(f"Error generating metadata with Gemini: {str(e)}")
        raise
