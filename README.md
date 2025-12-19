# MailRelay
Email relay with web form and API. Toggle between personal/work addresses, built with Cloudflare Workers + Gmail API


# Project Specifications

## Overview

MailRelay is an email relay service built on Cloudflare Workers using Gmail API. It provides both a web interface and REST API for sending emails to pre-configured personal and work addresses.

-----

## Core Features

### 1. Web Form Interface

- **Pincode Authentication**: Optional URL parameter (`?pincode=xxx`) for bookmarking. If not provided, displays pincode input field
- **Address Toggle**: Switch between personal and work email addresses
- **Subject Field**: Text input for email subject line (required)
- **Message Field**: Textarea for email body/description
- **Submit Button**: Send email via form submission
- **Success/Error Feedback**: Visual confirmation of email delivery status

### 2. REST API

- **POST Endpoint**: `/api/send` for programmatic email sending
- **Authentication**: Pincode in request body for simple authentication
- **JSON Payload**: Accepts structured email data
- **Response Codes**: Standard HTTP status codes with error messages

-----

## Technical Stack

### Backend

- **Runtime**: Cloudflare Workers
- **Email Provider**: Gmail API
- **Language**: JavaScript/TypeScript
- **Deployment**: Wrangler CLI

### Frontend

- **Framework**: Vanilla HTML/CSS/JS (or specify if you want React, etc.)
- **Styling**: TailwindCSS / plain CSS
- **Hosting**: Served from same Cloudflare Worker

-----

## Configuration

### Environment Variables

```
PERSONAL_EMAIL=your-personal@example.com
WORK_EMAIL=your-work@example.com
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
PINCODE=your-secret-pincode
FROM_EMAIL=your-gmail-account@gmail.com
FROM_NAME=MailRelay
```

-----

## API Specification

### POST `/api/send`

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "pincode": "string",
  "destination": "personal" | "work",
  "subject": "string",
  "message": "string"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "destination": "personal"
  }
}
```

**Response (Error - 400/401/500):**

```json
{
  "success": false,
  "message": "Error message description",
  "data": null
}
```

**Consistent Structure Benefits:**

- Client only needs to check `success` boolean
- `message` always contains human-readable feedback
- `data` contains payload (object on success, null on error)
- Same parsing logic for all responses

-----

## User Interface Design

### Web Form Layout

```
┌─────────────────────────────────────┐
│          MailRelay 📧               │
├─────────────────────────────────────┤
│                                     │
│  Pincode:  [________________]       │
│            (hidden if in URL)       │
│                                     │
│  Send To:  ( ) Personal  ( ) Work   │
│                                     │
│  Subject:  [________________]       │
│                                     │
│  Message:  ┌──────────────────┐     │
│            │                  │     │
│            │                  │     │
│            │                  │     │
│            └──────────────────┘     │
│                                     │
│            [  Send Email  ]         │
│                                     │
└─────────────────────────────────────┘
```

**Pincode URL Parameter**: Users can bookmark `/?pincode=xxx` to skip entering pincode each time.

Error feedback is crucial. log all information and print all information except for sensitive information like keys to make debugging easier. 
In the API return in the response an error message with as much information as possible. 
-----

## Security Considerations

- **Simple Pincode Authentication**: Pincode compared against `PINCODE` environment variable
  - Can be passed as URL parameter `?pincode=xxx` for web form bookmarking
  - Required in API request body
  - Not highly secure, but sufficient for personal use MVP
- **Input Validation**: Validate and sanitize all user inputs
- **CORS Configuration**: Configure appropriate CORS headers for API access
- **Environment Variables**: Store all sensitive data (emails, pincode, API keys) in environment variables, never in code
- **No Rate Limiting**: Intentionally omitted for MVP simplicity (add later if needed)

-----

## Deployment Pipeline (GitHub Actions)

### Workflow Triggers

1. **Manual**: Create issue with “@claude setup deployment pipeline”
1. **Automatic**: On push to `main` branch, deploy to Cloudflare

### Pipeline Steps

```yaml
- Checkout code
- Install dependencies
- Run tests (if any)
- Deploy with Wrangler
  - wrangler deploy
  - Use secrets from GitHub
```

-----

## Future Enhancements (Optional)

- llm integration to enhance the subject and description in case of typos. 

-----

**Questions to finalize:**

1. Do you want TypeScript or JavaScript?  depends, typescript requires compilation, but is type safe. depends on github actions.
1. Any specific styling preferences (minimal, modern, colorful)? minimal but modern.
1. Should the form have validation (required fields, max length)?  Subject is required.
1. Do you want email confirmation/receipts? no

