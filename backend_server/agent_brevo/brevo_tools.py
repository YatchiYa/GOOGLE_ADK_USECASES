"""
Brevo API Tools for contact management and email operations
"""

import requests
import json
from typing import Dict, List, Optional, Any 

# Base URL for Brevo API
BREVO_BASE_URL = "https://api.brevo.com/v3"

def get_headers(api_key: str) -> Dict[str, str]:
    """Get standard headers for Brevo API requests"""
    return {
        'api-key': api_key,
        'Content-Type': 'application/json'
    }
 
def create_contact(
    api_key: str,
    email: str,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    attributes: Optional[Dict[str, Any]] = None,
    list_ids: Optional[List[int]] = None,
    update_enabled: bool = False
) -> Dict[str, Any]:
    """
    Create a new contact in Brevo.
    
    Args:
        api_key: Brevo API key
        email: Contact email address (required)
        first_name: Contact first name
        last_name: Contact last name
        attributes: Additional contact attributes as key-value pairs
        list_ids: List of list IDs to add the contact to
        update_enabled: Whether to update if contact already exists
    
    Returns:
        Dict containing the API response with contact ID or error details
    """
    url = f"{BREVO_BASE_URL}/contacts"
    
    # Build contact data
    contact_data = {
        "email": email,
        "updateEnabled": update_enabled
    }
    
    # Build attributes
    contact_attributes = {}
    if first_name:
        contact_attributes["FIRSTNAME"] = first_name
    if last_name:
        contact_attributes["LASTNAME"] = last_name
    if attributes:
        contact_attributes.update(attributes)
    
    if contact_attributes:
        contact_data["attributes"] = contact_attributes
    
    if list_ids:
        contact_data["listIds"] = list_ids
    
    try:
        response = requests.post(
            url,
            headers=get_headers(api_key),
            json=contact_data
        )
        
        if response.status_code == 201:
            return {
                "success": True,
                "message": "Contact created successfully",
                "data": response.json()
            }
        else:
            return {
                "success": False,
                "error": f"Failed to create contact: {response.status_code}",
                "details": response.json() if response.content else "No response content"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Exception occurred: {str(e)}"
        }


def get_contact(api_key: str, identifier: str) -> Dict[str, Any]:
    """
    Get a contact by email or ID from Brevo.
    
    Args:
        api_key: Brevo API key
        identifier: Contact email address or contact ID
    
    Returns:
        Dict containing contact information or error details
    """
    url = f"{BREVO_BASE_URL}/contacts/{requests.utils.quote(identifier, safe='')}"
    
    try:
        response = requests.get(url, headers=get_headers(api_key))
        
        if response.status_code == 200:
            return {
                "success": True,
                "message": "Contact retrieved successfully",
                "data": response.json()
            }
        elif response.status_code == 404:
            return {
                "success": False,
                "error": "Contact not found",
                "details": f"No contact found with identifier: {identifier}"
            }
        else:
            return {
                "success": False,
                "error": f"Failed to get contact: {response.status_code}",
                "details": response.json() if response.content else "No response content"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Exception occurred: {str(e)}"
        }


def get_all_contacts(
    api_key: str,
    limit: int = 50,
    offset: int = 0,
    list_ids: Optional[List[int]] = None,
    sort: str = "desc"
) -> Dict[str, Any]:
    """
    Get all contacts from Brevo with pagination.
    
    Args:
        api_key: Brevo API key
        limit: Number of contacts to retrieve (max 50)
        offset: Number of contacts to skip
        list_ids: Filter by specific list IDs
        sort: Sort order ('asc' or 'desc')
    
    Returns:
        Dict containing contacts list and pagination info
    """
    url = f"{BREVO_BASE_URL}/contacts"
    
    params = {
        "limit": min(limit, 50),  # Brevo max is 50
        "offset": offset,
        "sort": sort
    }
    
    if list_ids:
        params["listIds"] = ",".join(map(str, list_ids))
    
    try:
        response = requests.get(url, headers=get_headers(api_key), params=params)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "message": f"Retrieved {len(data.get('contacts', []))} contacts",
                "data": data,
                "pagination": {
                    "count": data.get("count", 0),
                    "limit": limit,
                    "offset": offset
                }
            }
        else:
            return {
                "success": False,
                "error": f"Failed to get contacts: {response.status_code}",
                "details": response.json() if response.content else "No response content"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Exception occurred: {str(e)}"
        }


def update_contact(
    api_key: str,
    identifier: str,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    attributes: Optional[Dict[str, Any]] = None,
    list_ids: Optional[List[int]] = None,
    unlink_list_ids: Optional[List[int]] = None,
    email_blacklisted: bool = False,
    sms_blacklisted: bool = False
) -> Dict[str, Any]:
    """
    Update an existing contact in Brevo.
    
    Args:
        api_key: Brevo API key
        identifier: Contact email address or contact ID
        first_name: Updated first name
        last_name: Updated last name
        attributes: Additional attributes to update
        list_ids: List IDs to add contact to
        unlink_list_ids: List IDs to remove contact from
        email_blacklisted: Whether to blacklist email
        sms_blacklisted: Whether to blacklist SMS
    
    Returns:
        Dict containing success status or error details
    """
    url = f"{BREVO_BASE_URL}/contacts/{requests.utils.quote(identifier, safe='')}"
    
    # Build update data
    update_data = {
        "emailBlacklisted": email_blacklisted,
        "smsBlacklisted": sms_blacklisted
    }
    
    # Build attributes
    contact_attributes = {}
    if first_name is not None:
        contact_attributes["FIRSTNAME"] = first_name
    if last_name is not None:
        contact_attributes["LASTNAME"] = last_name
    if attributes:
        contact_attributes.update(attributes)
    
    if contact_attributes:
        update_data["attributes"] = contact_attributes
    
    if list_ids:
        update_data["listIds"] = list_ids
    
    if unlink_list_ids:
        update_data["unlinkListIds"] = unlink_list_ids
    
    try:
        response = requests.put(
            url,
            headers=get_headers(api_key),
            json=update_data
        )
        
        if response.status_code == 204:
            return {
                "success": True,
                "message": "Contact updated successfully"
            }
        else:
            return {
                "success": False,
                "error": f"Failed to update contact: {response.status_code}",
                "details": response.json() if response.content else "No response content"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Exception occurred: {str(e)}"
        }


def delete_contact(api_key: str, identifier: str) -> Dict[str, Any]:
    """
    Delete a contact from Brevo.
    
    Args:
        api_key: Brevo API key
        identifier: Contact email address or contact ID
    
    Returns:
        Dict containing success status or error details
    """
    url = f"{BREVO_BASE_URL}/contacts/{requests.utils.quote(identifier, safe='')}"
    
    try:
        response = requests.delete(url, headers=get_headers(api_key))
        
        if response.status_code == 204:
            return {
                "success": True,
                "message": "Contact deleted successfully",
                "deleted": True
            }
        elif response.status_code == 404:
            return {
                "success": False,
                "error": "Contact not found",
                "details": f"No contact found with identifier: {identifier}"
            }
        else:
            return {
                "success": False,
                "error": f"Failed to delete contact: {response.status_code}",
                "details": response.json() if response.content else "No response content"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Exception occurred: {str(e)}"
        }


def create_bulk_contacts(
    api_key: str,
    contacts: List[Dict[str, Any]],
    list_ids: Optional[List[int]] = None,
    update_existing: bool = True
) -> Dict[str, Any]:
    """
    Create multiple contacts in bulk using Brevo import API.
    
    Args:
        api_key: Brevo API key
        contacts: List of contact dictionaries with email and attributes
        list_ids: List IDs to add contacts to
        update_existing: Whether to update existing contacts
    
    Returns:
        Dict containing process ID and status
    """
    url = f"{BREVO_BASE_URL}/contacts/import"
    
    # Format contacts for bulk import
    file_body = []
    for contact in contacts:
        contact_data = {
            "email": contact.get("email")
        }
        if "attributes" in contact:
            contact_data["attributes"] = contact["attributes"]
        file_body.append(contact_data)
    
    import_data = {
        "fileBody": file_body,
        "updateExistingContacts": update_existing,
        "emptyContactsAttributes": False,
        "emailBlacklist": False,
        "smsBlacklist": False
    }
    
    if list_ids:
        import_data["listIds"] = list_ids
    
    try:
        response = requests.post(
            url,
            headers=get_headers(api_key),
            json=import_data
        )
        
        if response.status_code == 202:
            data = response.json()
            return {
                "success": True,
                "message": "Bulk import started successfully",
                "data": data,
                "process_id": data.get("processId"),
                "note": "Import runs in background. Use process_id to check status."
            }
        else:
            return {
                "success": False,
                "error": f"Failed to start bulk import: {response.status_code}",
                "details": response.json() if response.content else "No response content"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Exception occurred: {str(e)}"
        }


def send_transactional_email(
    api_key: str,
    sender_email: str,
    sender_name: str,
    to_email: str,
    to_name: str,
    subject: str,
    html_content: Optional[str] = None,
    text_content: Optional[str] = None,
    template_id: Optional[int] = None,
    params: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Send a transactional email via Brevo.
    
    Args:
        api_key: Brevo API key
        sender_email: Sender email address
        sender_name: Sender name
        to_email: Recipient email address
        to_name: Recipient name
        subject: Email subject
        html_content: HTML email content
        text_content: Plain text email content
        template_id: Brevo template ID (optional)
        params: Template parameters for personalization
    
    Returns:
        Dict containing message ID or error details
    """
    url = f"{BREVO_BASE_URL}/smtp/email"
    
    email_data = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },
        "to": [
            {
                "email": to_email,
                "name": to_name
            }
        ],
        "subject": subject
    }
    
    if html_content:
        email_data["htmlContent"] = html_content
    
    if text_content:
        email_data["textContent"] = text_content
    
    if template_id:
        email_data["templateId"] = template_id
    
    if params:
        email_data["params"] = params
    
    try:
        response = requests.post(
            url,
            headers=get_headers(api_key),
            json=email_data
        )
        
        if response.status_code == 201:
            data = response.json()
            return {
                "success": True,
                "message": "Email sent successfully",
                "data": data,
                "message_id": data.get("messageId")
            }
        else:
            return {
                "success": False,
                "error": f"Failed to send email: {response.status_code}",
                "details": response.json() if response.content else "No response content"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Exception occurred: {str(e)}"
        }
