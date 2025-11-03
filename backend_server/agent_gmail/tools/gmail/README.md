# Gmail Integration Tool

A comprehensive Gmail API integration tool that allows agents to read, list, and analyze Gmail emails using OAuth2 authentication.

## Features

### 🔐 Authentication
- **Dynamic Token Management**: Secure token storage with automatic expiration handling
- **OAuth2 Integration**: Frontend Google OAuth2 login with token sync to backend
- **Token Refresh**: Automatic token validation and refresh capabilities

### 📧 Email Operations
- **List Emails**: Filter emails by various criteria (unread, today, important, starred)
- **Email Details**: Get detailed information about specific emails
- **Email Statistics**: Get comprehensive email statistics and counts
- **Search & Filter**: Advanced email filtering and search capabilities

### 📊 Analytics
- **Email Stats**: Total messages, unread count, today's emails, important emails
- **User Profile**: Gmail profile information and account details
- **Usage Tracking**: Monitor API usage and performance

## Available Tools

### Core Functions

#### `gmail_list_emails(filter_type, max_results)`
List Gmail emails with various filters.

**Parameters:**
- `filter_type` (str): Filter type - "all", "unread", "today", "this_week", "important", "starred"
- `max_results` (str): Maximum number of emails to return (1-500)

**Example:**
```python
# Get unread emails
result = gmail_list_emails("unread", "20")

# Get today's emails
result = gmail_list_emails("today", "10")
```

#### `gmail_get_email_details(message_id)`
Get detailed information about a specific email.

**Parameters:**
- `message_id` (str): Gmail message ID

**Example:**
```python
details = gmail_get_email_details("17c9b9e4f2a1b2c3")
```

#### `gmail_get_stats()`
Get Gmail email statistics.

**Example:**
```python
stats = gmail_get_stats()
# Returns: total messages, unread count, today's count, etc.
```

#### `gmail_update_tokens(access_token, refresh_token, user_email, expires_in)`
Update Gmail authentication tokens.

**Parameters:**
- `access_token` (str): Gmail access token
- `refresh_token` (str): Gmail refresh token (optional)
- `user_email` (str): User's email address (optional)
- `expires_in` (str): Token expiration time in seconds

## Frontend Integration

### Gmail Connection Panel

The `GmailConnectionPanel` component provides:

- **Google OAuth2 Login**: Seamless Google account authentication
- **Email Statistics Display**: Real-time email counts and statistics
- **Token Synchronization**: Automatic token sync with backend
- **Connection Status**: Visual connection status and error handling

### Usage in React

```tsx
import GmailConnectionPanel from '@/components/GmailConnectionPanel';

<GmailConnectionPanel
  agentId={agentId}
  sessionId={sessionId}
  onConnectionChange={(connected) => console.log('Gmail connected:', connected)}
  className="w-full"
/>
```

## Backend API Endpoints

### Authentication Endpoints

#### `POST /api/v1/gmail/tokens`
Update Gmail authentication tokens.

**Request Body:**
```json
{
  "access_token": "ya29.a0...",
  "refresh_token": "1//04...",
  "user_email": "user@gmail.com",
  "expires_in": 3600
}
```

#### `GET /api/v1/gmail/tokens/status`
Get current token status.

#### `DELETE /api/v1/gmail/tokens`
Clear stored tokens.

#### `POST /api/v1/gmail/test-connection`
Test Gmail API connection.

#### `GET /api/v1/gmail/stats`
Get email statistics via API.

## Configuration

### Google OAuth2 Setup

1. **Google Cloud Console**: Create OAuth2 credentials
2. **Scopes Required**:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`

3. **Client Configuration**:
```javascript
const CLIENT_ID = "your-client-id.apps.googleusercontent.com";
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';
```

## Security Features

### Token Management
- **Secure Storage**: Tokens stored with expiration tracking
- **Automatic Cleanup**: Expired tokens automatically removed
- **Scope Validation**: Proper OAuth2 scope enforcement

### Error Handling
- **API Rate Limiting**: Handles Gmail API rate limits
- **Token Expiration**: Graceful handling of expired tokens
- **Network Errors**: Robust error handling for network issues

## Example Usage Scenarios

### 1. Daily Email Summary
```python
# Get today's emails
today_emails = gmail_list_emails("today", "50")

# Get email statistics
stats = gmail_get_stats()

# Generate summary
summary = f"Today: {stats['today_count']} emails, {stats['unread_count']} unread"
```

### 2. Important Email Processing
```python
# Get important emails
important = gmail_list_emails("important", "10")

# Process each important email
for email in important['emails']:
    details = gmail_get_email_details(email['id'])
    # Process email content...
```

### 3. Unread Email Management
```python
# Get unread emails
unread = gmail_list_emails("unread", "25")

# Analyze unread emails
for email in unread['emails']:
    print(f"From: {email['from']}")
    print(f"Subject: {email['subject']}")
    print(f"Snippet: {email['snippet']}")
```

## Error Handling

The tool provides comprehensive error handling:

```python
{
  "success": false,
  "error": "Gmail API request failed: 401 Unauthorized",
  "message": "Failed to list emails with filter: unread"
}
```

Common error scenarios:
- **Authentication Errors**: Invalid or expired tokens
- **API Limits**: Rate limiting and quota exceeded
- **Network Issues**: Connection timeouts and failures
- **Invalid Parameters**: Malformed requests or invalid filters

## Logging

The tool uses structured logging with loguru:

```python
logger.info("✅ Gmail tokens updated successfully")
logger.error("❌ Failed to list emails: API request failed")
logger.debug("🔄 Syncing Gmail tokens with agent")
```

## Testing

Run the integration tests:

```bash
cd /path/to/backend
python3 test_gmail_integration.py
```

The test suite covers:
- Import validation
- Token management
- Tool function execution
- Error handling

## Dependencies

### Backend
- `requests`: HTTP client for Gmail API
- `loguru`: Structured logging
- `fastapi`: API framework
- `pydantic`: Data validation

### Frontend
- `react`: UI framework
- `react-icons`: Icon components
- `typescript`: Type safety

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify OAuth2 credentials
   - Check token expiration
   - Validate required scopes

2. **API Rate Limits**
   - Implement exponential backoff
   - Monitor API usage quotas
   - Use appropriate request batching

3. **Token Sync Issues**
   - Verify backend API endpoints
   - Check CORS configuration
   - Validate request headers

### Debug Mode

Enable debug logging:
```python
import logging
logging.getLogger().setLevel(logging.DEBUG)
```

## License

This Gmail integration tool is part of the Google ADK Multi-Agent system and follows the same licensing terms.
