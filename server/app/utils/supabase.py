"""Supabase client utility for authentication and storage."""
import os
import logging
from supabase import create_client, Client

logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """Create and return Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment")
    
    return create_client(url, key)


def get_supabase_storage_client() -> Client:
    """Create and return Supabase client with service role key for storage operations."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment")
    
    return create_client(url, key)


def get_storage_bucket_name() -> str:
    """Get storage bucket name from environment or return default."""
    return os.getenv("SUPABASE_STORAGE_BUCKET", "pdfs")


def delete_file_from_storage(file_path: str) -> bool:
    """Delete a file from Supabase Storage bucket.
    
    Args:
        file_path: Storage path (e.g., "uploads/abc123.pdf")
    
    Returns:
        True if deletion succeeded, False otherwise
    """
    try:
        supabase = get_supabase_storage_client()
        bucket_name = get_storage_bucket_name()
        
        # Delete file from storage
        response = supabase.storage.from_(bucket_name).remove([file_path])
        
        # Check if there was an error
        if hasattr(response, 'error') and response.error:
            logger.warning(f"Failed to delete file {file_path} from storage: {response.error}")
            return False
        
        logger.info(f"Successfully deleted file {file_path} from storage bucket {bucket_name}")
        return True
    except Exception as e:
        logger.warning(f"Error deleting file {file_path} from storage: {str(e)}")
        return False

