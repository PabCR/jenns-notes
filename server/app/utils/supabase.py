"""Supabase client utility for authentication."""
import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Create and return Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment")
    
    return create_client(url, key)

