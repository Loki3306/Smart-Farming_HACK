"""
Supabase Client Module
Provides a singleton Supabase client for the Regime System
"""

import os
from typing import Optional
from supabase import create_client, Client


_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get or create Supabase client singleton.
    
    Returns:
        Client: Supabase client instance
        
    Raises:
        ValueError: If SUPABASE_URL or SUPABASE_KEY environment variables are not set
    """
    global _supabase_client
    
    if _supabase_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY environment variables must be set. "
                "Please configure your .env file."
            )
        
        _supabase_client = create_client(supabase_url, supabase_key)
    
    return _supabase_client


def reset_supabase_client():
    """Reset the Supabase client singleton (useful for testing)"""
    global _supabase_client
    _supabase_client = None
