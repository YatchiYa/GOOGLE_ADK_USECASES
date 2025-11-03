"""
Gmail Reader Tool for Google API Integration
Allows reading and listing emails from Gmail accounts using OAuth tokens
"""

import json
import time
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union, Any
from loguru import logger 


# Gmail API Configuration
GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1'
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
]

# Dynamic token storage (updated from frontend)
_dynamic_tokens = {
    "access_token": None,
    "refresh_token": None,
    "user_email": None,
    "expires_at": None,
    "last_updated": None
}



def update_gmail_tokens(
    access_token: str,
    refresh_token: Optional[str] = None,
    user_email: Optional[str] = None,
    expires_in: Optional[int] = 3600
) -> Dict[str, Any]:
    """
    Update Gmail authentication tokens from frontend.
    
    Args:
        access_token: Gmail access token
        refresh_token: Gmail refresh token (optional)
        user_email: User's email address (optional)
        expires_in: Token expiration time in seconds
        
    Returns:
        Dict containing update status
        
    Example:
        result = update_gmail_tokens(
            access_token="ya29.a0...",
            refresh_token="1//04...",
            user_email="user@gmail.com",
            expires_in=3600
        )
    """
    global _dynamic_tokens
    
    try:
        expires_at = time.time() + expires_in if expires_in else None
        
        _dynamic_tokens.update({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user_email": user_email,
            "expires_at": expires_at,
            "last_updated": time.time()
        })
        
        logger.info(f"✅ Gmail tokens updated successfully")
        logger.info(f"   User email: {user_email}")
        logger.info(f"   Expires at: {datetime.fromtimestamp(expires_at) if expires_at else 'Unknown'}")
        
        return {
            "success": True,
            "message": "Gmail tokens updated successfully",
            "user_email": user_email,
            "expires_at": expires_at,
            "updated_at": _dynamic_tokens["last_updated"]
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to update Gmail tokens: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to update Gmail tokens"
        }


def get_active_tokens() -> Dict[str, str]:
    """
    Get currently active tokens.
    
    Returns:
        Dict containing active tokens or None if expired/missing
    """
    if not _dynamic_tokens["access_token"]:
        return None
        
    # Check if token is expired
    if _dynamic_tokens["expires_at"] and time.time() >= _dynamic_tokens["expires_at"]:
        logger.warning("Gmail access token has expired")
        return None
    
    return {
        "access_token": _dynamic_tokens["access_token"],
        "user_email": _dynamic_tokens["user_email"]
    }


def _make_gmail_request(endpoint: str, params: Dict = None) -> Dict[str, Any]:
    """
    Make authenticated request to Gmail API.
    
    Args:
        endpoint: Gmail API endpoint (without base URL)
        params: Query parameters
        
    Returns:
        API response data
    """
    tokens = get_active_tokens()
    if not tokens:
        raise Exception("No valid Gmail tokens available. Please authenticate first.")
    
    headers = {
        'Authorization': f'Bearer {tokens["access_token"]}',
        'Content-Type': 'application/json'
    }
    
    url = f"{GMAIL_API_BASE}/{endpoint}"
    
    try:
        response = requests.get(url, headers=headers, params=params or {})
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Gmail API request failed: {e}")
        raise Exception(f"Gmail API request failed: {e}")



def get_user_profile() -> Dict[str, Any]:
    """
    Get Gmail user profile information.
    
    Returns:
        Dict containing user profile data
        
    Example:
        profile = get_user_profile()
    """
    try:
        data = _make_gmail_request("users/me/profile")
        
        logger.info(f"✅ Retrieved Gmail profile for: {data.get('emailAddress')}")
        
        return {
            "success": True,
            "data": {
                "email": data.get("emailAddress"),
                "messages_total": data.get("messagesTotal", 0),
                "threads_total": data.get("threadsTotal", 0),
                "history_id": data.get("historyId")
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get Gmail profile: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to get Gmail profile"
        }



def list_emails(
    filter_type: str = "all",
    max_results: int = 10,
    include_spam_trash: bool = False,
    include_body: bool = True
) -> Dict[str, Any]:
    """
    List emails based on filter criteria.
    
    Args:
        filter_type: Type of emails to retrieve
                    - "all": All emails
                    - "unread": Unread emails only
                    - "today": Emails from today
                    - "this_week": Emails from this week
                    - "important": Important emails
                    - "starred": Starred emails
        max_results: Maximum number of emails to return (1-500)
        include_spam_trash: Include spam and trash emails
        include_body: Whether to extract full email body content (slower but more complete)
        
    Returns:
        Dict containing email list and metadata
        
    Example:
        emails = list_emails(filter_type="unread", max_results=20, include_body=True)
    """
    try:
        # Build query based on filter type
        query_parts = []
        
        if filter_type == "unread":
            query_parts.append("is:unread")
        elif filter_type == "today":
            today = datetime.now().strftime("%Y/%m/%d")
            query_parts.append(f"after:{today}")
        elif filter_type == "this_week":
            week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y/%m/%d")
            query_parts.append(f"after:{week_ago}")
        elif filter_type == "important":
            query_parts.append("is:important")
        elif filter_type == "starred":
            query_parts.append("is:starred")
        
        if not include_spam_trash:
            query_parts.extend(["-in:spam", "-in:trash"])
        
        query = " ".join(query_parts) if query_parts else ""
        
        # Get message list
        params = {
            "maxResults": min(max_results, 500),
            "q": query
        }
        
        messages_data = _make_gmail_request("users/me/messages", params)
        messages = messages_data.get("messages", [])
        
        if not messages:
            return {
                "success": True,
                "data": {
                    "emails": [],
                    "total_count": 0,
                    "filter_type": filter_type,
                    "query_used": query
                }
            }
        
        # Get detailed info for each message
        detailed_emails = []
        for msg in messages[:max_results]:
            try:
                msg_data = _make_gmail_request(f"users/me/messages/{msg['id']}")
                
                # Extract email details
                headers = {h['name']: h['value'] for h in msg_data.get('payload', {}).get('headers', [])}
                
                # Extract body content (only if requested)
                body_text = ""
                body_html = ""
                email_body = msg_data.get("snippet", "")
                
                if include_body:
                    def extract_body(payload):
                        nonlocal body_text, body_html
                        
                        if payload.get('body', {}).get('data'):
                            content = payload['body']['data']
                            # Decode base64 content
                            import base64
                            try:
                                decoded = base64.urlsafe_b64decode(content + '===').decode('utf-8', errors='ignore')
                                
                                if payload.get('mimeType') == 'text/plain':
                                    body_text = decoded
                                elif payload.get('mimeType') == 'text/html':
                                    body_html = decoded
                            except Exception as decode_error:
                                logger.warning(f"Failed to decode body content: {decode_error}")
                        
                        # Check parts for multipart messages
                        for part in payload.get('parts', []):
                            extract_body(part)
                    
                    extract_body(msg_data.get('payload', {}))
                    
                    # Use text content, fallback to HTML, then snippet
                    email_body = body_text or body_html or msg_data.get("snippet", "")
                
                email_info = {
                    "id": msg_data.get("id"),
                    "thread_id": msg_data.get("threadId"),
                    "subject": headers.get("Subject", "No Subject"),
                    "from": headers.get("From", "Unknown Sender"),
                    "to": headers.get("To", ""),
                    "date": headers.get("Date", ""),
                    "snippet": msg_data.get("snippet", ""),
                    "body": email_body,
                    "body_text": body_text,
                    "body_html": body_html,
                    "labels": msg_data.get("labelIds", []),
                    "is_unread": "UNREAD" in msg_data.get("labelIds", []),
                    "is_important": "IMPORTANT" in msg_data.get("labelIds", []),
                    "is_starred": "STARRED" in msg_data.get("labelIds", []),
                    "has_attachments": bool(any(part.get('filename') for part in msg_data.get('payload', {}).get('parts', []))),
                    "size_estimate": msg_data.get("sizeEstimate", 0)
                }
                
                detailed_emails.append(email_info)
                
            except Exception as e:
                logger.warning(f"Failed to get details for message {msg['id']}: {e}")
                continue
        
        logger.info(f"✅ Retrieved {len(detailed_emails)} emails with filter: {filter_type}")
        
        return {
            "success": True,
            "data": {
                "emails": detailed_emails,
                "total_count": len(detailed_emails),
                "filter_type": filter_type,
                "query_used": query,
                "max_results": max_results
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to list emails: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to list emails"
        }


def get_email_details(message_id: str) -> Dict[str, Any]:
    """
    Get detailed information for a specific email by message ID.
    Get detailed information about a specific email.
    
    Args:
        message_id: Gmail message ID
        
    Returns:
        Dict containing detailed email information
        
    Example:
        details = get_email_details("17c9b9e4f2a1b2c3")
    """
    try:
        msg_data = _make_gmail_request(f"users/me/messages/{message_id}")
        
        # Extract headers
        headers = {h['name']: h['value'] for h in msg_data.get('payload', {}).get('headers', [])}
        
        # Extract body
        body_text = ""
        body_html = ""
        
        def extract_body(payload):
            nonlocal body_text, body_html
            
            if payload.get('body', {}).get('data'):
                content = payload['body']['data']
                # Decode base64 content
                import base64
                decoded = base64.urlsafe_b64decode(content + '===').decode('utf-8', errors='ignore')
                
                if payload.get('mimeType') == 'text/plain':
                    body_text = decoded
                elif payload.get('mimeType') == 'text/html':
                    body_html = decoded
            
            # Check parts for multipart messages
            for part in payload.get('parts', []):
                extract_body(part)
        
        extract_body(msg_data.get('payload', {}))
        
        logger.info(f"✅ Retrieved msg_data ===============  : {msg_data}")
        
        email_details = {
            "id": msg_data.get("id"),
            "thread_id": msg_data.get("threadId"),
            "subject": headers.get("Subject", "No Subject"),
            "from": headers.get("From", "Unknown Sender"),
            "to": headers.get("To", ""),
            "cc": headers.get("Cc", ""),
            "bcc": headers.get("Bcc", ""),
            "date": headers.get("Date", ""),
            "snippet": msg_data.get("snippet", ""),
            "body_text": body_text,
            "body_html": body_html,
            "labels": msg_data.get("labelIds", []),
            "is_unread": "UNREAD" in msg_data.get("labelIds", []),
            "is_important": "IMPORTANT" in msg_data.get("labelIds", []),
            "is_starred": "STARRED" in msg_data.get("labelIds", []),
            "size_estimate": msg_data.get("sizeEstimate", 0)
        }
        
        logger.info(f"✅ Retrieved email details for: {message_id}")
        
        return {
            "success": True,
            "data": email_details
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get email details: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to get email details for: {message_id}"
        }


def get_email_stats() -> Dict[str, Any]:
    """
    Get email statistics and counts.
    
    Returns:
        Dict containing email statistics
        
    Example:
        stats = get_email_stats()
    """
    try:
        # Get profile for total counts
        profile_data = _make_gmail_request("users/me/profile")
        
        # Get counts for different categories
        stats = {
            "total_messages": profile_data.get("messagesTotal", 0),
            "total_threads": profile_data.get("threadsTotal", 0)
        }
        
        # Count unread emails
        unread_data = _make_gmail_request("users/me/messages", {"q": "is:unread", "maxResults": 1})
        stats["unread_count"] = unread_data.get("resultSizeEstimate", 0)
        
        # Count today's emails
        today = datetime.now().strftime("%Y/%m/%d")
        today_data = _make_gmail_request("users/me/messages", {"q": f"after:{today}", "maxResults": 1})
        stats["today_count"] = today_data.get("resultSizeEstimate", 0)
        
        # Count important emails
        important_data = _make_gmail_request("users/me/messages", {"q": "is:important", "maxResults": 1})
        stats["important_count"] = important_data.get("resultSizeEstimate", 0)
        
        # Count starred emails
        starred_data = _make_gmail_request("users/me/messages", {"q": "is:starred", "maxResults": 1})
        stats["starred_count"] = starred_data.get("resultSizeEstimate", 0)
        
        logger.info(f"✅ Retrieved Gmail statistics")
        
        return {
            "success": True,
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get email stats: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to get email statistics"
        }


# Main tool functions that can be called by the agent
def gmail_list_emails(
    filter_type: str = "all",
    max_results: str = "10",
    include_body: str = "true"
) -> str:
    """
    Tool function to list Gmail emails.
    
    Args:
        filter_type: Type of emails ("all", "unread", "today", "this_week", "important", "starred")
        max_results: Maximum number of emails to return (as string)
        include_body: Whether to include full email body content ("true" or "false")
        
    Returns:
        JSON string with email list results
    """
    try:
        max_results_int = int(max_results)
        include_body_bool = include_body.lower() == "true"
        result = list_emails(filter_type, max_results_int, include_body=include_body_bool)
        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})


def gmail_get_email_details(message_id: str) -> str:
    """
    Tool function to get detailed email information.
    
    Args:
        message_id: Gmail message ID
        
    Returns:
        JSON string with email details
    """
    try:
        result = get_email_details(message_id)
        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})


def gmail_get_stats() -> str:
    """
    Tool function to get Gmail statistics.
    
    Returns:
        JSON string with email statistics
    """
    try:
        result = get_email_stats()
        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})


def gmail_update_tokens(
    access_token: str,
    refresh_token: str = "",
    user_email: str = "",
    expires_in: str = "3600"
) -> str:
    """
    Tool function to update Gmail authentication tokens.
    
    Args:
        access_token: Gmail access token
        refresh_token: Gmail refresh token (optional)
        user_email: User's email address (optional)
        expires_in: Token expiration time in seconds (as string)
        
    Returns:
        JSON string with update status
    """
    try:
        expires_in_int = int(expires_in) if expires_in else 3600
        result = update_gmail_tokens(
            access_token=access_token,
            refresh_token=refresh_token if refresh_token else None,
            user_email=user_email if user_email else None,
            expires_in=expires_in_int
        )
        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})



def get_email_details(message_id: str) -> Dict[str, Any]:
    """
    Get detailed information for a specific email by message ID.
    
    Args:
        message_id: Gmail message ID
        
    Returns:
        Dict containing detailed email information
    """
    try:
        msg_data = _make_gmail_request(f"users/me/messages/{message_id}")
        
        # Extract email details
        headers = {h['name']: h['value'] for h in msg_data.get('payload', {}).get('headers', [])}
        
        # Extract body content
        def extract_body(payload):
            body_text = ""
            body_html = ""
            
            if payload.get('body', {}).get('data'):
                # Single part message
                import base64
                body_data = payload['body']['data']
                body_text = base64.urlsafe_b64decode(body_data).decode('utf-8', errors='ignore')
            elif payload.get('parts'):
                # Multi-part message
                for part in payload['parts']:
                    if part.get('mimeType') == 'text/plain' and part.get('body', {}).get('data'):
                        import base64
                        body_data = part['body']['data']
                        body_text = base64.urlsafe_b64decode(body_data).decode('utf-8', errors='ignore')
                    elif part.get('mimeType') == 'text/html' and part.get('body', {}).get('data'):
                        import base64
                        body_data = part['body']['data']
                        body_html = base64.urlsafe_b64decode(body_data).decode('utf-8', errors='ignore')
            
            return body_text, body_html
        
        body_text, body_html = extract_body(msg_data.get('payload', {}))
        
        email_details = {
            "id": msg_data.get("id"),
            "thread_id": msg_data.get("threadId"),
            "subject": headers.get("Subject", "No Subject"),
            "from": headers.get("From", "Unknown Sender"),
            "to": headers.get("To", ""),
            "cc": headers.get("Cc", ""),
            "bcc": headers.get("Bcc", ""),
            "date": headers.get("Date", ""),
            "body_text": body_text,
            "body_html": body_html,
            "snippet": msg_data.get("snippet", ""),
            "labels": msg_data.get("labelIds", []),
            "size_estimate": msg_data.get("sizeEstimate", 0),
            "headers": headers
        }
        
        return {
            "success": True,
            "data": email_details
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to get email details"
        }



def search_emails(query: str, max_results: int = 10, include_body: bool = False) -> Dict[str, Any]:
    """
    Search emails using Gmail search syntax.
    
    Args:
        query: Gmail search query
        max_results: Maximum number of results
        include_body: Whether to include full email body content
        
    Returns:
        Dict containing search results
    """
    try:
        # Get message list using search query
        params = {
            "maxResults": min(max_results, 500),
            "q": query
        }
        
        messages_data = _make_gmail_request("users/me/messages", params)
        messages = messages_data.get("messages", [])
        
        if not messages:
            return {
                "success": True,
                "data": {
                    "emails": [],
                    "total_count": 0,
                    "query": query
                }
            }
        
        # Get detailed info for each message
        detailed_emails = []
        for msg in messages[:max_results]:
            try:
                if include_body:
                    details_result = get_email_details(msg['id'])
                    if details_result.get("success"):
                        detailed_emails.append(details_result["data"])
                else:
                    msg_data = _make_gmail_request(f"users/me/messages/{msg['id']}")
                    headers = {h['name']: h['value'] for h in msg_data.get('payload', {}).get('headers', [])}
                    
                    detailed_emails.append({
                        "id": msg_data.get("id"),
                        "thread_id": msg_data.get("threadId"),
                        "subject": headers.get("Subject", "No Subject"),
                        "from": headers.get("From", "Unknown Sender"),
                        "date": headers.get("Date", ""),
                        "snippet": msg_data.get("snippet", ""),
                        "labels": msg_data.get("labelIds", [])
                    })
                    
            except Exception as e:
                continue
        
        return {
            "success": True,
            "data": {
                "emails": detailed_emails,
                "total_count": len(detailed_emails),
                "query": query,
                "include_body": include_body
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to search emails"
        }
