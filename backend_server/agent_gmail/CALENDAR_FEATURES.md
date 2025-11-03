# 📅 Gmail & Calendar Expert - Calendar Features

## 🎯 **Calendar Integration Overview**

The Gmail & Calendar Expert now includes comprehensive Google Calendar functionality, providing complete calendar management alongside email operations using the same OAuth authentication.

## 🔧 **Calendar Tools Available**

### Calendar Management Tools

#### `get_calendar_list`
List all accessible Google Calendars for the authenticated user.

**Returns:**
- Calendar ID, name, and description
- Primary calendar identification
- Access roles and permissions
- Color coding information

**Example Usage:**
```
Show me all my Google Calendars
```

#### `get_calendar_events`
Retrieve events from specific calendars with flexible filtering.

**Parameters:**
- `calendar_id` (str): Calendar ID (default: "primary")
- `time_min` (str, optional): Start date filter (ISO 8601)
- `time_max` (str, optional): End date filter (ISO 8601)
- `max_results` (int): Maximum events to return (default: 10)
- `single_events` (bool): Expand recurring events (default: True)
- `order_by` (str): Sort order ("startTime" or "updated")

**Example Usage:**
```
Get my calendar events for the next 7 days
Show me all events from my work calendar this week
List upcoming meetings for today
```

#### `create_calendar_event`
Create new calendar events with full details and attendee management.

**Parameters:**
- `calendar_id` (str): Target calendar ID
- `summary` (str): Event title
- `description` (str): Event description
- `location` (str): Event location
- `start_time` (str): Start time (ISO 8601)
- `end_time` (str): End time (ISO 8601)
- `all_day` (bool): All-day event flag
- `attendees` (list): List of attendee emails
- `timezone` (str): Event timezone

**Example Usage:**
```
Create a meeting titled "Project Review" tomorrow at 2 PM for 1 hour with john@company.com and sarah@company.com
Schedule an all-day event "Company Retreat" for next Friday
```

#### `update_calendar_event`
Modify existing calendar events including attendees and details.

**Parameters:**
- `calendar_id` (str): Calendar containing the event
- `event_id` (str): Event ID to update
- `summary` (str, optional): New title
- `description` (str, optional): New description
- `location` (str, optional): New location
- `start_time` (str, optional): New start time
- `end_time` (str, optional): New end time
- `attendees` (list, optional): Updated attendee list

**Example Usage:**
```
Update the meeting "Project Review" to start at 3 PM instead of 2 PM
Change the location of event abc123 to "Conference Room B"
Add alice@company.com to the attendees of my next team meeting
```

#### `delete_calendar_event`
Remove calendar events safely with confirmation.

**Parameters:**
- `calendar_id` (str): Calendar containing the event
- `event_id` (str): Event ID to delete

**Example Usage:**
```
Delete the event with ID abc123
Cancel my meeting titled "Weekly Standup" scheduled for tomorrow
```

#### `search_calendar_events`
Search for events using text queries across date ranges.

**Parameters:**
- `calendar_id` (str): Calendar to search in
- `query` (str): Search query text
- `time_min` (str, optional): Search start date
- `time_max` (str, optional): Search end date
- `max_results` (int): Maximum results to return

**Example Usage:**
```
Find all events containing "project" in the last month
Search for meetings with "client" in the title for next week
Look for events at "Conference Room A" this month
```

## 🚀 **Calendar Usage Examples**

### Basic Calendar Operations

1. **View Calendar List:**
```
Show me all my Google Calendars and their details
```

2. **Today's Schedule:**
```
What's on my calendar today?
```

3. **Weekly Overview:**
```
Show me all my events for this week
```

### Event Creation

4. **Simple Meeting:**
```
Schedule a 1-hour meeting titled "Team Sync" tomorrow at 10 AM
```

5. **Meeting with Attendees:**
```
Create a meeting "Quarterly Review" next Tuesday 2-4 PM with boss@company.com, colleague1@company.com, and colleague2@company.com in Conference Room A
```

6. **All-Day Event:**
```
Add "Annual Conference" as an all-day event for March 15th
```

### Event Management

7. **Update Meeting:**
```
Move my "Project Review" meeting from 2 PM to 3 PM tomorrow
```

8. **Add Attendees:**
```
Add newteam@company.com to my "Sprint Planning" meeting next Monday
```

9. **Change Location:**
```
Update the location of my "Client Presentation" to "Zoom Meeting Room"
```

### Advanced Search & Analysis

10. **Find Conflicts:**
```
Show me all meetings scheduled during lunch hours (12-1 PM) this month
```

11. **Attendee Analysis:**
```
Find all meetings with john@company.com in the last 2 weeks
```

12. **Room Booking Check:**
```
Search for all events in "Conference Room A" next week to check availability
```

## 🔐 **Authentication & Scopes**

### Updated OAuth Scopes
The frontend now requests these Google API scopes:
- `https://www.googleapis.com/auth/gmail.readonly` - Read Gmail emails
- `https://www.googleapis.com/auth/gmail.send` - Send Gmail emails
- `https://www.googleapis.com/auth/calendar` - Full Google Calendar access
- `https://www.googleapis.com/auth/userinfo.profile` - User profile info
- `https://www.googleapis.com/auth/userinfo.email` - User email address

### Token Sharing
Calendar tools use the same OAuth tokens as Gmail tools, providing seamless integration without additional authentication steps.

## 📊 **Calendar Data Insights**

### Event Analytics
- **Meeting Frequency**: Analyze meeting patterns and frequency
- **Time Allocation**: Understand how time is distributed across different types of events
- **Attendee Patterns**: Identify frequent collaborators and meeting participants
- **Location Usage**: Track which meeting rooms or locations are used most

### Scheduling Intelligence
- **Conflict Detection**: Identify scheduling conflicts and overlapping events
- **Free Time Analysis**: Find available time slots for new meetings
- **Meeting Duration Trends**: Analyze typical meeting lengths and patterns
- **Recurring Event Management**: Handle recurring meetings and exceptions

## 🎨 **Integration Features**

### Email-Calendar Sync
- **Meeting Invitations**: Create calendar events from email meeting requests
- **Email Scheduling**: Send emails about upcoming calendar events
- **Reminder Integration**: Email reminders for important calendar events
- **Follow-up Actions**: Schedule follow-up meetings based on email conversations

### Cross-Platform Productivity
- **Unified Search**: Search across both emails and calendar events
- **Context Awareness**: Understand relationships between emails and meetings
- **Smart Suggestions**: Suggest meeting times based on email conversations
- **Workflow Automation**: Automate common email-calendar workflows

## 🛠️ **Advanced Calendar Features**

### Multi-Calendar Support
- Work with multiple calendars (personal, work, shared)
- Cross-calendar event management
- Calendar-specific permissions and access control

### Recurring Events
- Handle recurring meeting patterns
- Manage exceptions to recurring events
- Bulk operations on recurring event series

### Time Zone Management
- Proper timezone handling for global teams
- Automatic timezone conversion
- Multi-timezone event scheduling

### Attendee Management
- Add/remove attendees from events
- Track RSVP responses
- Manage meeting permissions and visibility

## 📈 **Calendar Best Practices**

### Efficient Scheduling
- Use specific time ranges for event queries
- Leverage search functionality for finding events
- Batch calendar operations when possible
- Respect API rate limits for bulk operations

### Data Privacy
- Handle calendar data with appropriate privacy considerations
- Respect attendee privacy and permissions
- Secure handling of meeting details and locations
- Proper access control for shared calendars

### Performance Optimization
- Use appropriate date ranges to minimize API calls
- Cache frequently accessed calendar data
- Efficient pagination for large event lists
- Smart filtering to reduce unnecessary data transfer

## 🎯 **Calendar Capabilities Summary**

✅ **Complete Calendar Access** - Full Google Calendar API integration
✅ **Event CRUD Operations** - Create, read, update, delete calendar events
✅ **Multi-Calendar Support** - Work with multiple calendars simultaneously
✅ **Advanced Search** - Text-based event search with date filtering
✅ **Attendee Management** - Full attendee invitation and management
✅ **Recurring Events** - Handle recurring meeting patterns
✅ **Time Zone Support** - Proper timezone handling for global scheduling
✅ **Email Integration** - Seamless integration with Gmail operations
✅ **Smart Analytics** - Calendar pattern analysis and insights
✅ **Security & Privacy** - Secure OAuth authentication and data handling

The Gmail & Calendar Expert now provides a complete productivity solution, combining email management with comprehensive calendar operations for efficient workflow management! 📅✨
