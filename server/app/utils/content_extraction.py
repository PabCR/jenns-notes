"""Content extraction utilities for different resource types."""
import logging
import httpx
from bs4 import BeautifulSoup
from app.utils.supabase import get_supabase_storage_client, get_storage_bucket_name

logger = logging.getLogger(__name__)


def extract_webpage_content(url: str, max_chars: int = 8000) -> str:
    """Extract text content from a webpage.
    
    Args:
        url: Webpage URL to fetch
        max_chars: Maximum number of characters to extract (default: 8000)
    
    Returns:
        Extracted text content, truncated to max_chars if needed.
        Returns empty string on error.
    """
    print(f"Fetching webpage content from: {url}")
    try:
        # Fetch webpage with timeout
        with httpx.Client(timeout=10.0, follow_redirects=True) as client:
            response = client.get(url)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Extract text
            text = soup.get_text()
            
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            # Truncate if needed
            if len(text) > max_chars:
                text = text[:max_chars]
            
            return text.strip()
    
    except httpx.TimeoutException:
        logger.warning(f"Timeout fetching webpage: {url}")
        return ""
    except httpx.HTTPError as e:
        logger.warning(f"HTTP error fetching webpage {url}: {str(e)}")
        return ""
    except Exception as e:
        logger.error(f"Error extracting webpage content from {url}: {str(e)}")
        return ""


def extract_note_content(content: str, max_chars: int = 8000) -> str:
    """Extract text content from a note (direct pass-through with truncation).
    
    Args:
        content: Note text content
        max_chars: Maximum number of characters to return (default: 8000)
    
    Returns:
        Content truncated to max_chars if needed.
    """
    if not content:
        return ""
    
    # Truncate if needed
    if len(content) > max_chars:
        return content[:max_chars].strip()
    
    return content.strip()


def extract_pdf_content(file_path: str) -> bytes:
    """Download PDF file from storage and return as bytes.
    
    Args:
        file_path: Storage path (e.g., "uploads/abc123.pdf")
    
    Returns:
        PDF file bytes
    
    Raises:
        ValueError: If file_path is invalid or file doesn't exist
        Exception: If download fails
    """
    # Validate path format
    if not file_path or not file_path.startswith("uploads/") or not file_path.endswith(".pdf"):
        raise ValueError(f"Invalid PDF file path: {file_path}")
    
    if ".." in file_path:
        raise ValueError(f"Invalid PDF file path (contains '..'): {file_path}")
    
    try:
        supabase = get_supabase_storage_client()
        bucket_name = get_storage_bucket_name()
        
        # Download file from storage
        pdf_bytes = supabase.storage.from_(bucket_name).download(file_path)
        
        if pdf_bytes is None:
            raise ValueError(f"PDF file not found: {file_path}")
        
        return pdf_bytes
    
    except Exception as e:
        logger.error(f"Error downloading PDF from storage {file_path}: {str(e)}")
        raise
