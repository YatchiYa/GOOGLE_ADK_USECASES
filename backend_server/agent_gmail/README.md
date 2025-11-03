# ✉️ Gmail Expert Agent

A comprehensive AI agent for Gmail operations with dynamic OAuth authentication, email reading, sending, and advanced search capabilities.

## 🎯 **Agent Overview**

The Gmail Expert Agent is a specialized AI assistant that excels in:

- **Email Management**: Complete Gmail email reading and organization
- **Email Sending**: Rich email composition with attachments and formatting
- **Advanced Search**: Complex Gmail search queries and filtering
- **OAuth Integration**: Dynamic token management with frontend authentication
- **Email Analytics**: Email pattern analysis and insights

## 🔐 **Dynamic Authentication System**

### OAuth Token Management
The agent uses a dynamic token system that integrates with your frontend authentication:

#### Backend Endpoints
- **`POST /gmail/tokens`**: Set Gmail OAuth tokens from frontend
- **`GET /gmail/status`**: Check current authentication status

#### Token Update Process
```python
# Tokens are updated dynamically from frontend
update_gmail_tokens(
    access_token="ya29.a0...",
    refresh_token="1//04...",
    user_email="user@gmail.com",
    expires_in=3600
)
```

### Frontend Integration
The Gmail connection panel automatically handles OAuth flow and token management:

```typescript
// Gmail authentication hook
const { isAuthenticated, userEmail, updateTokens } = useGmailAuth();

// Update tokens after OAuth
await updateTokens({
  access_token: "ya29.a0...",
  refresh_token: "1//04...",
  user_email: "user@gmail.com"
});
```

## 🔧 **Available Tools**

### Authentication Tools

#### `update_gmail_tokens`
Update OAuth tokens for Gmail API access.

**Parameters:**
- `access_token` (str): Gmail access token
- `refresh_token` (str, optional): Gmail refresh token
- `user_email` (str, optional): User's email address
- `expires_in` (int): Token expiration time in seconds

**Example Usage:**
```
Update Gmail tokens with access token ya29.a0abc123 and user email john@gmail.com
```

#### `get_user_profile`
Retrieve Gmail account information and statistics.

**Returns:**
- Email address
- Total message count
- Total thread count
- History ID

**Example Usage:**
```
Get my Gmail profile information
```

### Email Reading Tools

#### `list_emails`
List emails with smart filtering and pagination.

**Parameters:**
- `filter_type` (str): Email filter type
  - `"all"`: All emails
  - `"unread"`: Unread emails only
  - `"today"`: Emails from today
  - `"this_week"`: Emails from this week
  - `"important"`: Important emails
  - `"starred"`: Starred emails
- `max_results` (int): Maximum emails to return (1-500)
- `include_spam_trash` (bool): Include spam/trash emails
- `include_body` (bool): Extract full email body content

**Example Usage:**
```
List my 20 most recent unread emails with full body content
```

#### `get_email_details`
Get complete details for a specific email by message ID.

**Parameters:**
- `message_id` (str): Gmail message ID

**Returns:**
- Complete email headers
- Body text and HTML content
- Attachments information
- Labels and metadata

**Example Usage:**
```
Get full details for email with ID 17a1b2c3d4e5f678
```

#### `search_emails`
Advanced email search using Gmail search syntax.

**Parameters:**
- `query` (str): Gmail search query
- `max_results` (int): Maximum results to return
- `include_body` (bool): Include full email body content

**Gmail Search Examples:**
- `"from:boss@company.com"`: Emails from specific sender
- `"subject:urgent"`: Emails with "urgent" in subject
- `"has:attachment"`: Emails with attachments
- `"after:2024/01/01"`: Emails after specific date
- `"is:unread from:client@example.com"`: Unread emails from client

**Example Usage:**
```
Search for emails from support@company.com with subject containing "invoice" in the last month
```

### Email Sending Tools

#### `send_email`
Send emails with rich content and attachments.

**Parameters:**
- `to_email` (str): Recipient email address
- `subject` (str): Email subject
- `body` (str): Email body content
- `from_email` (str, optional): Sender email (uses authenticated account)
- `cc` (list, optional): CC recipients
- `bcc` (list, optional): BCC recipients
- `attachments` (list, optional): File attachments

**Example Usage:**
```
Send an email to client@example.com with subject "Project Update" and body "The project is progressing well..."
```

## 🚀 **Usage Examples**

### Authentication & Setup

1. **Check Authentication Status:**
```
Check if I'm authenticated with Gmail
```

2. **Get Profile Information:**
```
Show me my Gmail account information and email statistics
```

### Email Reading Operations

3. **List Recent Emails:**
```
Show me my 10 most recent emails
```

4. **Filter Unread Emails:**
```
List all unread emails from today with full content
```

5. **Search for Specific Emails:**
```
Find all emails from john@company.com about "project alpha" in the last week
```

6. **Get Email Details:**
```
Show me the complete details of the email with ID 17a1b2c3d4e5f678
```

### Email Sending Operations

7. **Send Simple Email:**
```
Send an email to team@company.com with subject "Meeting Tomorrow" and message "Don't forget about our 2 PM meeting tomorrow."
```

8. **Send Email with Rich Content:**
```
Send a follow-up email to client@example.com with subject "Thank you for the meeting" and include a professional thank you message with next steps.
```

### Advanced Search Operations

9. **Complex Search:**
```
Find all important emails from the last month that have attachments and are from external domains (not @mycompany.com)
```

10. **Email Analysis:**
```
Analyze my email patterns: show me the top 5 senders from the last week and summarize the main topics
```

## 📊 **Gmail Search Syntax**

The agent supports full Gmail search syntax:

### Basic Operators
- `from:sender@example.com` - From specific sender
- `to:recipient@example.com` - To specific recipient
- `subject:keyword` - Subject contains keyword
- `has:attachment` - Has attachments
- `is:unread` - Unread emails
- `is:read` - Read emails
- `is:starred` - Starred emails
- `is:important` - Important emails

### Date Operators
- `after:2024/01/01` - After specific date
- `before:2024/12/31` - Before specific date
- `newer_than:7d` - Newer than 7 days
- `older_than:1m` - Older than 1 month

### Advanced Operators
- `label:inbox` - Specific label
- `filename:pdf` - Specific file type
- `size:larger_than:10M` - Size filters
- `"exact phrase"` - Exact phrase match
- `keyword OR another` - OR operator
- `-keyword` - Exclude keyword

## 🔐 **Security & Privacy**

### OAuth Security
- Secure token storage with expiration handling
- Automatic token refresh when possible
- No permanent storage of sensitive data
- Proper scope management for Gmail API

### Data Privacy
- Email content is processed temporarily only
- No logging of sensitive email data
- Respects Gmail API rate limits and quotas
- Secure authentication flow via Google OAuth

### Best Practices
- Always authenticate before email operations
- Use specific search queries to minimize API calls
- Respect Gmail API quotas and rate limits
- Handle authentication errors gracefully

## 🛠️ **Error Handling**

### Common Issues
- **Authentication Required**: Tokens not set or expired
- **API Rate Limits**: Too many requests in short time
- **Invalid Search Query**: Malformed Gmail search syntax
- **Email Not Found**: Invalid message ID or insufficient permissions

### Recovery Strategies
- Automatic token refresh when possible
- Clear error messages with suggested solutions
- Graceful degradation for partial failures
- Retry logic for temporary network issues

## 📈 **Advanced Features**

### Email Analytics
- Sender frequency analysis
- Subject line pattern recognition
- Email volume trends
- Response time analysis

### Bulk Operations
- Batch email processing
- Efficient pagination for large datasets
- Smart filtering to reduce API calls
- Progress tracking for long operations

### Integration Capabilities
- Real-time token updates from frontend
- Seamless OAuth flow integration
- Multi-account support (with proper tokens)
- Webhook support for real-time updates

## 🎯 **Agent Capabilities Summary**

✅ **Dynamic Authentication** - Real-time OAuth token management
✅ **Email Reading** - Complete Gmail email access with filtering
✅ **Advanced Search** - Full Gmail search syntax support
✅ **Email Sending** - Rich email composition with attachments
✅ **Security** - Secure token handling and data privacy
✅ **Analytics** - Email pattern analysis and insights
✅ **Error Recovery** - Comprehensive error handling and recovery
✅ **Frontend Integration** - Seamless UI authentication flow

The Gmail Expert Agent provides a complete, secure, and user-friendly solution for Gmail operations with professional-grade authentication and comprehensive email management capabilities! 📧✨
