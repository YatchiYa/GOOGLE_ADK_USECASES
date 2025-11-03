"""
Google Calendar Tools for event management and calendar operations
"""

import json
import time
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union, Any
from loguru import logger

# Google Calendar API Configuration
CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'

# Import token management from Gmail tools
from ..gmail.gmail_reader_tool import get_active_tokens


def _make_calendar_request(endpoint: str, method: str = 'GET', params: Dict = None, data: Dict = None) -> Dict[str, Any]:
    """
    Make authenticated request to Google Calendar API.
    
    Args:
        endpoint: Calendar API endpoint (without base URL)
        method: HTTP method (GET, POST, PUT, DELETE)
        params: Query parameters
        data: Request body data
        
    Returns:
        API response data
    """
    tokens = get_active_tokens()
    if not tokens:
        raise Exception("No valid Gmail/Google tokens available. Please authenticate first.")
    
    headers = {
        'Authorization': f'Bearer {tokens["access_token"]}',
        'Content-Type': 'application/json'
    }
    
    url = f"{CALENDAR_API_BASE}/{endpoint}"
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, params=params or {})
        elif method.upper() == 'POST':
            response = requests.post(url, headers=headers, params=params or {}, json=data)
        elif method.upper() == 'PUT':
            response = requests.put(url, headers=headers, params=params or {}, json=data)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, headers=headers, params=params or {})
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
            
        response.raise_for_status()
        return response.json() if response.content else {}
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Calendar API request failed: {e}")
        raise Exception(f"Calendar API request failed: {e}")


def get_calendar_list() -> Dict[str, Any]:
    """
    Get list of user's calendars.
    
    Returns:
        Dict containing calendar list and metadata
        
    Example:
        calendars = get_calendar_list()
    """
    try:
        data = _make_calendar_request("users/me/calendarList")
        
        calendars = []
        for calendar_item in data.get("items", []):
            calendars.append({
                "id": calendar_item.get("id"),
                "summary": calendar_item.get("summary"),
                "description": calendar_item.get("description", ""),
                "primary": calendar_item.get("primary", False),
                "access_role": calendar_item.get("accessRole"),
                "color_id": calendar_item.get("colorId"),
                "background_color": calendar_item.get("backgroundColor"),
                "foreground_color": calendar_item.get("foregroundColor")
            })
        
        logger.info(f"✅ Retrieved {len(calendars)} calendars")
        
        return {
            "success": True,
            "data": {
                "calendars": calendars,
                "total_count": len(calendars)
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get calendar list: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to get calendar list"
        }


def get_calendar_events(
    calendar_id: str = "primary",
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
    max_results: int = 10,
    single_events: bool = True,
    order_by: str = "startTime"
) -> Dict[str, Any]:
    """
    Get events from a specific calendar.
    
    Args:
        calendar_id: Calendar ID (default: "primary")
        time_min: Lower bound for event start time (ISO 8601)
        time_max: Upper bound for event start time (ISO 8601)
        max_results: Maximum number of events to return
        single_events: Whether to expand recurring events
        order_by: Order of events ("startTime" or "updated")
        
    Returns:
        Dict containing events list and metadata
        
    Example:
        events = get_calendar_events(calendar_id="primary", max_results=20)
    """
    try:
        params = {
            "maxResults": min(max_results, 2500),
            "singleEvents": single_events,
            "orderBy": order_by
        }
        
        # Set default time range if not provided
        if not time_min:
            time_min = datetime.now().isoformat() + 'Z'
        if not time_max:
            time_max = (datetime.now() + timedelta(days=30)).isoformat() + 'Z'
            
        params["timeMin"] = time_min
        params["timeMax"] = time_max
        
        data = _make_calendar_request(f"calendars/{calendar_id}/events", params=params)
        
        events = []
        for event_item in data.get("items", []):
            # Parse start and end times
            start = event_item.get("start", {})
            end = event_item.get("end", {})
            
            start_time = start.get("dateTime") or start.get("date")
            end_time = end.get("dateTime") or end.get("date")
            
            events.append({
                "id": event_item.get("id"),
                "summary": event_item.get("summary", "No Title"),
                "description": event_item.get("description", ""),
                "location": event_item.get("location", ""),
                "start_time": start_time,
                "end_time": end_time,
                "all_day": "date" in start,  # All-day events use "date" instead of "dateTime"
                "status": event_item.get("status"),
                "creator": event_item.get("creator", {}).get("email", ""),
                "organizer": event_item.get("organizer", {}).get("email", ""),
                "attendees": [
                    {
                        "email": attendee.get("email"),
                        "response_status": attendee.get("responseStatus"),
                        "display_name": attendee.get("displayName", "")
                    }
                    for attendee in event_item.get("attendees", [])
                ],
                "html_link": event_item.get("htmlLink"),
                "created": event_item.get("created"),
                "updated": event_item.get("updated")
            })
        
        logger.info(f"✅ Retrieved {len(events)} events from calendar: {calendar_id}")
        
        return {
            "success": True,
            "data": {
                "events": events,
                "total_count": len(events),
                "calendar_id": calendar_id,
                "time_range": {
                    "start": time_min,
                    "end": time_max
                }
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get calendar events: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to get calendar events"
        }


def create_calendar_event(
    calendar_id: str = "primary",
    summary: str = "",
    description: str = "",
    location: str = "",
    start_time: str = "",
    end_time: str = "",
    all_day: bool = False,
    attendees: Optional[List[str]] = None,
    timezone: str = "UTC"
) -> Dict[str, Any]:
    """
    Create a new calendar event.
    
    Args:
        calendar_id: Calendar ID to create event in
        summary: Event title/summary
        description: Event description
        location: Event location
        start_time: Start time (ISO 8601 format)
        end_time: End time (ISO 8601 format)
        all_day: Whether this is an all-day event
        attendees: List of attendee email addresses
        timezone: Timezone for the event
        
    Returns:
        Dict containing created event details
        
    Example:
        event = create_calendar_event(
            summary="Team Meeting",
            start_time="2024-01-15T10:00:00",
            end_time="2024-01-15T11:00:00",
            attendees=["colleague@example.com"]
        )
    """
    try:
        event_data = {
            "summary": summary,
            "description": description,
            "location": location
        }
        
        # Handle start and end times
        if all_day:
            # For all-day events, use date format
            start_date = datetime.fromisoformat(start_time.replace('Z', '')).date().isoformat()
            end_date = datetime.fromisoformat(end_time.replace('Z', '')).date().isoformat()
            
            event_data["start"] = {"date": start_date}
            event_data["end"] = {"date": end_date}
        else:
            # For timed events, use dateTime format
            event_data["start"] = {
                "dateTime": start_time,
                "timeZone": timezone
            }
            event_data["end"] = {
                "dateTime": end_time,
                "timeZone": timezone
            }
        
        # Add attendees if provided
        if attendees:
            event_data["attendees"] = [{"email": email} for email in attendees]
        
        data = _make_calendar_request(
            f"calendars/{calendar_id}/events",
            method="POST",
            data=event_data
        )
        
        logger.info(f"✅ Created calendar event: {data.get('id')} - {summary}")
        
        return {
            "success": True,
            "data": {
                "event_id": data.get("id"),
                "summary": data.get("summary"),
                "html_link": data.get("htmlLink"),
                "created": data.get("created"),
                "start_time": data.get("start", {}).get("dateTime") or data.get("start", {}).get("date"),
                "end_time": data.get("end", {}).get("dateTime") or data.get("end", {}).get("date")
            },
            "message": "Calendar event created successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to create calendar event: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to create calendar event"
        }


def update_calendar_event(
    calendar_id: str = "primary",
    event_id: str = "",
    summary: Optional[str] = None,
    description: Optional[str] = None,
    location: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    attendees: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Update an existing calendar event.
    
    Args:
        calendar_id: Calendar ID containing the event
        event_id: Event ID to update
        summary: New event title/summary
        description: New event description
        location: New event location
        start_time: New start time (ISO 8601 format)
        end_time: New end time (ISO 8601 format)
        attendees: New list of attendee email addresses
        
    Returns:
        Dict containing updated event details
        
    Example:
        result = update_calendar_event(
            event_id="abc123",
            summary="Updated Meeting Title",
            location="Conference Room B"
        )
    """
    try:
        # First get the existing event
        existing_event = _make_calendar_request(f"calendars/{calendar_id}/events/{event_id}")
        
        # Update only provided fields
        if summary is not None:
            existing_event["summary"] = summary
        if description is not None:
            existing_event["description"] = description
        if location is not None:
            existing_event["location"] = location
        if start_time is not None:
            existing_event["start"]["dateTime"] = start_time
        if end_time is not None:
            existing_event["end"]["dateTime"] = end_time
        if attendees is not None:
            existing_event["attendees"] = [{"email": email} for email in attendees]
        
        # Update the event
        data = _make_calendar_request(
            f"calendars/{calendar_id}/events/{event_id}",
            method="PUT",
            data=existing_event
        )
        
        logger.info(f"✅ Updated calendar event: {event_id}")
        
        return {
            "success": True,
            "data": {
                "event_id": data.get("id"),
                "summary": data.get("summary"),
                "html_link": data.get("htmlLink"),
                "updated": data.get("updated")
            },
            "message": "Calendar event updated successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to update calendar event: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to update calendar event"
        }


def delete_calendar_event(
    calendar_id: str = "primary",
    event_id: str = ""
) -> Dict[str, Any]:
    """
    Delete a calendar event.
    
    Args:
        calendar_id: Calendar ID containing the event
        event_id: Event ID to delete
        
    Returns:
        Dict containing deletion status
        
    Example:
        result = delete_calendar_event(event_id="abc123")
    """
    try:
        _make_calendar_request(
            f"calendars/{calendar_id}/events/{event_id}",
            method="DELETE"
        )
        
        logger.info(f"✅ Deleted calendar event: {event_id}")
        
        return {
            "success": True,
            "message": "Calendar event deleted successfully",
            "deleted_event_id": event_id
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to delete calendar event: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to delete calendar event"
        }


def search_calendar_events(
    calendar_id: str = "primary",
    query: str = "",
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
    max_results: int = 25
) -> Dict[str, Any]:
    """
    Search for calendar events using text query.
    
    Args:
        calendar_id: Calendar ID to search in
        query: Search query text
        time_min: Lower bound for event start time (ISO 8601)
        time_max: Upper bound for event start time (ISO 8601)
        max_results: Maximum number of events to return
        
    Returns:
        Dict containing search results
        
    Example:
        results = search_calendar_events(query="meeting", max_results=10)
    """
    try:
        params = {
            "q": query,
            "maxResults": min(max_results, 2500),
            "singleEvents": True,
            "orderBy": "startTime"
        }
        
        # Set default time range if not provided
        if not time_min:
            time_min = (datetime.now() - timedelta(days=30)).isoformat() + 'Z'
        if not time_max:
            time_max = (datetime.now() + timedelta(days=90)).isoformat() + 'Z'
            
        params["timeMin"] = time_min
        params["timeMax"] = time_max
        
        data = _make_calendar_request(f"calendars/{calendar_id}/events", params=params)
        
        events = []
        for event_item in data.get("items", []):
            start = event_item.get("start", {})
            end = event_item.get("end", {})
            
            events.append({
                "id": event_item.get("id"),
                "summary": event_item.get("summary", "No Title"),
                "description": event_item.get("description", ""),
                "location": event_item.get("location", ""),
                "start_time": start.get("dateTime") or start.get("date"),
                "end_time": end.get("dateTime") or end.get("date"),
                "html_link": event_item.get("htmlLink")
            })
        
        logger.info(f"✅ Found {len(events)} events matching query: {query}")
        
        return {
            "success": True,
            "data": {
                "events": events,
                "total_count": len(events),
                "query": query,
                "calendar_id": calendar_id
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to search calendar events: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to search calendar events"
        }
