# 📧 Brevo Expert Agent

A comprehensive AI agent for Brevo (formerly SendinBlue) platform operations, providing complete contact management and email functionality.

## 🎯 **Agent Overview**

The Brevo Expert Agent is a specialized AI assistant that excels in:

- **Contact Management**: Full CRUD operations for Brevo contacts
- **Bulk Operations**: Efficient handling of large-scale contact imports/updates
- **Email Operations**: Transactional email sending with personalization
- **API Integration**: Complete Brevo API integration with error handling
- **Data Analysis**: Contact data insights and performance metrics

## 🔧 **Available Tools**

### Contact Management Tools

#### `create_contact`
Create a new contact in Brevo with full attribute support.

**Parameters:**
- `api_key` (str): Brevo API key
- `email` (str): Contact email address (required)
- `first_name` (str, optional): Contact first name
- `last_name` (str, optional): Contact last name
- `attributes` (dict, optional): Additional contact attributes
- `list_ids` (list, optional): List IDs to add contact to
- `update_enabled` (bool): Update if contact exists (default: False)

**Example Usage:**
```
Create a contact with email john@example.com, first name John, last name Doe, and add to list 2
```

#### `get_contact`
Retrieve contact information by email or ID.

**Parameters:**
- `api_key` (str): Brevo API key
- `identifier` (str): Contact email address or contact ID

**Example Usage:**
```
Get contact information for john@example.com
```

#### `get_all_contacts`
Retrieve multiple contacts with pagination and filtering.

**Parameters:**
- `api_key` (str): Brevo API key
- `limit` (int): Number of contacts to retrieve (max 50, default: 50)
- `offset` (int): Number of contacts to skip (default: 0)
- `list_ids` (list, optional): Filter by specific list IDs
- `sort` (str): Sort order 'asc' or 'desc' (default: 'desc')

**Example Usage:**
```
Get the first 25 contacts from lists 2 and 5, sorted in ascending order
```

#### `update_contact`
Update existing contact information and list memberships.

**Parameters:**
- `api_key` (str): Brevo API key
- `identifier` (str): Contact email address or contact ID
- `first_name` (str, optional): Updated first name
- `last_name` (str, optional): Updated last name
- `attributes` (dict, optional): Additional attributes to update
- `list_ids` (list, optional): List IDs to add contact to
- `unlink_list_ids` (list, optional): List IDs to remove contact from
- `email_blacklisted` (bool): Email blacklist status (default: False)
- `sms_blacklisted` (bool): SMS blacklist status (default: False)

**Example Usage:**
```
Update contact john@example.com with new last name "Smith" and add to list 3
```

#### `delete_contact`
Safely remove a contact from Brevo.

**Parameters:**
- `api_key` (str): Brevo API key
- `identifier` (str): Contact email address or contact ID

**Example Usage:**
```
Delete contact with email john@example.com
```

#### `create_bulk_contacts`
Import multiple contacts efficiently using Brevo's bulk import API.

**Parameters:**
- `api_key` (str): Brevo API key
- `contacts` (list): List of contact dictionaries with email and attributes
- `list_ids` (list, optional): List IDs to add all contacts to
- `update_existing` (bool): Update existing contacts (default: True)

**Example Usage:**
```
Import 3 contacts: alice@example.com, bob@example.com, carol@example.com with their names and add to list 2
```

### Email Tools

#### `send_transactional_email`
Send personalized transactional emails via Brevo.

**Parameters:**
- `api_key` (str): Brevo API key
- `sender_email` (str): Sender email address
- `sender_name` (str): Sender name
- `to_email` (str): Recipient email address
- `to_name` (str): Recipient name
- `subject` (str): Email subject
- `html_content` (str, optional): HTML email content
- `text_content` (str, optional): Plain text email content
- `template_id` (int, optional): Brevo template ID
- `params` (dict, optional): Template parameters for personalization

**Example Usage:**
```
Send a welcome email to john@example.com with subject "Welcome!" and HTML content "<h1>Hello John!</h1>"
```

## 🚀 **Usage Examples**

### Basic Contact Operations

1. **Create a Contact:**
```
I need to create a contact with email sarah@company.com, first name Sarah, last name Johnson, and add her to list 5. Use API key xkeysib-abc123.
```

2. **Get Contact Information:**
```
Please retrieve all information for contact sarah@company.com using API key xkeysib-abc123.
```

3. **Update Contact:**
```
Update contact sarah@company.com to change her last name to "Williams" and add her to list 8. API key: xkeysib-abc123.
```

### Bulk Operations

4. **Import Multiple Contacts:**
```
Import these contacts to list 2:
- alice@example.com (Alice Smith)
- bob@example.com (Bob Jones)  
- carol@example.com (Carol White)
Use API key xkeysib-abc123.
```

5. **List All Contacts:**
```
Get the first 20 contacts from my Brevo account, sorted by most recent. API key: xkeysib-abc123.
```

### Email Operations

6. **Send Transactional Email:**
```
Send a welcome email from support@mycompany.com (My Company) to new-user@example.com (John Doe) with subject "Welcome to My Company!" and HTML content "<h1>Welcome John!</h1><p>Thanks for joining us!</p>". API key: xkeysib-abc123.
```

## 🔐 **Security & Best Practices**

### API Key Management
- Always provide your actual Brevo API key (starts with `xkeysib-`)
- Never share API keys in public or unsecured channels
- Get your API key from: https://account.brevo.com/advanced/api

### Data Validation
- Email addresses are validated before API calls
- Contact data is sanitized to prevent errors
- Bulk operations include data integrity checks

### Rate Limiting
- Respects Brevo API rate limits
- Bulk operations are optimized for efficiency
- Error handling includes retry logic for temporary failures

## 📊 **Response Format**

All tools return structured responses with:

```json
{
  "success": true/false,
  "message": "Human-readable description",
  "data": { /* API response data */ },
  "error": "Error description (if failed)",
  "details": "Additional error details"
}
```

## 🛠️ **Error Handling**

The agent handles common scenarios:

- **Invalid API Key**: Clear authentication error messages
- **Contact Not Found**: Specific 404 error handling
- **Rate Limiting**: Guidance on API limits and quotas
- **Data Validation**: Email format and required field validation
- **Network Issues**: Timeout and connection error handling

## 📈 **Advanced Features**

### Contact Analytics
- Contact count and pagination information
- List membership analysis
- Data quality insights

### Email Tracking
- Message ID tracking for sent emails
- Delivery status monitoring
- Template usage optimization

### Integration Support
- Webhook configuration guidance
- Bulk operation process tracking
- Data export and backup strategies

## 🔗 **Brevo API Documentation**

- **Official Docs**: https://developers.brevo.com
- **API Reference**: https://developers.brevo.com/reference/
- **Swagger Spec**: https://api.brevo.com/v3/swagger_definition.yml
- **Account Management**: https://account.brevo.com

## 💡 **Tips for Best Results**

1. **Always provide your real API key** - the agent cannot work with placeholder keys
2. **Use specific email addresses** - avoid generic examples like "user@example.com"
3. **Specify list IDs** when you want contacts added to specific lists
4. **Include contact attributes** for better data organization
5. **Use bulk operations** for multiple contacts to improve efficiency
6. **Test with small batches** before large imports
7. **Backup data** before bulk delete operations

## 🎯 **Agent Capabilities Summary**

✅ **Contact CRUD Operations** - Complete create, read, update, delete functionality
✅ **Bulk Data Management** - Efficient handling of large contact datasets  
✅ **Email Sending** - Transactional email with personalization
✅ **Error Recovery** - Comprehensive error handling and troubleshooting
✅ **Data Validation** - Input validation and data integrity checks
✅ **Performance Optimization** - Efficient API usage and rate limit management
✅ **Security Compliance** - Secure API key handling and data protection

The Brevo Expert Agent is your complete solution for professional email marketing and contact management operations! 🚀
