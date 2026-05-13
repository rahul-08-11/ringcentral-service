# ringcentral-service
 
An Azure Functions service that integrates with the RingCentral API to send SMS messages programmatically. Built with Node.js and deployed as a serverless HTTP API.
 
## What it does
 
- Exposes a REST API endpoint to send SMS via RingCentral
- Authenticates with RingCentral using JWT and handles token refresh automatically
- Supports custom message formatting (newline injection via `&newLine&` placeholder)
- CORS-enabled for cross-origin requests
## Endpoints
 
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/ping` | Health check |
| POST | `/api/send/sms` | Send an SMS message |
 
### Send SMS
 
**POST** `/api/send/sms`
 
```json
{
  "to": "+1234567890",
  "message": "Hello! This is line 1&newLine&This is line 2"
}
```
 
**Response**
```json
{
  "success": true,
  "message": "SMS sent successfully!",
  "data": { ... }
}
```
 
