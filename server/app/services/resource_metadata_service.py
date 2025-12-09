"""Content extraction and AI metadata generation helpers."""
import logging
from typing import Optional

from fastapi import HTTPException, UploadFile, status

from app.schemas.gemini import ResourceMetadata
from app.utils.content_extraction import (
    extract_note_content,
    extract_pdf_content,
    extract_webpage_content,
)
from app.utils.gemini import generate_resource_metadata

logger = logging.getLogger(__name__)


def _validate_resource_type(resource_type: str) -> None:
    if resource_type not in ["pdf", "link", "note"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid resource type: {resource_type}. Must be one of: pdf, link, note",
        )


async def _load_pdf_bytes(content: Optional[str], file: Optional[UploadFile]) -> bytes:
    if file:
        pdf_bytes = await file.read()
        if not pdf_bytes:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Uploaded file is empty",
            )
        return pdf_bytes
    if content:
        return extract_pdf_content(content)
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Either file upload or content (storage path) must be provided for PDFs",
    )


def _extract_text_content(resource_type: str, content: Optional[str]) -> str:
    if not content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Content must be provided for links and notes",
        )

    extracted_content = (
        extract_webpage_content(content)
        if resource_type == "link"
        else extract_note_content(content)
    )

    if not extracted_content or not extracted_content.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unable to extract content from this URL. The website may block automated access. Please add tags and description manually.",
        )
    return extracted_content


async def generate_metadata_response(
    resource_type: str,
    content: Optional[str],
    file: Optional[UploadFile],
) -> ResourceMetadata:
    """Generate structured metadata for a resource type."""
    _validate_resource_type(resource_type)

    try:
        if resource_type == "pdf":
            pdf_bytes = await _load_pdf_bytes(content, file)
            return generate_resource_metadata(pdf_bytes=pdf_bytes)

        extracted_content = _extract_text_content(resource_type, content)
        return generate_resource_metadata(content=extracted_content)
    except HTTPException:
        raise
    except ValueError as exc:
        logger.error("Validation error generating metadata: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("Error generating metadata with Gemini API: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate metadata: {str(exc)}",
        )
