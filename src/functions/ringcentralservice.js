const { app } = require('@azure/functions');

require("dotenv").config();
const express = require("express");
// const bodyParser = require("body-parser");
// const formData = require("express-form-data");
const axios = require("axios");
const RingCentral = require("@ringcentral/sdk");

// const app = express();
// app.use(bodyParser.json());
// // app.use(express.json());
// app.use(express.urlencoded({ extended: true })); 
// app.use(formData.parse());  


const RC_CLIENT_ID = process.env.RC_CLIENT_ID;
const RC_CLIENT_SECRET = process.env.RC_CLIENT_SECRET;
const RC_JWT = process.env.RC_JWT;
const RC_API_SERVER = process.env.RC_API_SERVER;
const RC_PHONE_NUMBER = process.env.RC_PHONE_NUMBER;

let accessToken = null;
let refreshToken = null;

// Initialize RingCentral SDK
const rc = new RingCentral.SDK({
  server: RC_API_SERVER,
  clientId: RC_CLIENT_ID,
  clientSecret: RC_CLIENT_SECRET,
});


app.http('ping', {
    methods: ['GET', 'POST'],
    authLevel: 'function',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        return { status: 200, body: JSON.stringify({ success: true, message: "Service is Up!" }) };
    }
});



// Authenticate using JWT
async function authenticate() {
  try {
    console.log("Authenticating with JWT...");
    const authResponse = await rc.platform().login({ jwt: process.env.JWT_SECRET });
    const authResponseJson = await authResponse.json();
    console.log("Authentication response:", authResponseJson);
    accessToken = authResponseJson.access_token;
    refreshToken = authResponseJson.refresh_token;
    console.log("Authentication successful!");
  } catch (error) {
  
    console.error("Authentication failed:", error.response.data);
  }
}

// Refresh the access token
async function refreshAccessToken() {
  try {
    const response = await rc.platform().login({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const authResponseJson = await authResponse.json();
    console.log("Authentication response:", authResponseJson);
    accessToken = authResponseJson.access_token;
    refreshToken = authResponseJson.refresh_token;
    console.log("Token refreshed successfully!");
  } catch (error) {
    console.error("Failed to refresh token:", error.response.data);
    await authenticate(); // Re-authenticate if refresh fails
  }
}
app.http('SendSMSFunction', {
    methods: ['POST'],
    authLevel: 'function',
    route: 'send/sms',
    handler: async (request, context) => {
      context.info(`Processing SMS request for ${request.url}`);
  
      let requestBody;
      try {
        requestBody = await request.json();
      } catch (error) {
        return { status: 400, body: "Invalid JSON body" };
      }
  
      const { to, message } = requestBody;

      context.info(`Sending SMS to ${to} with message: ${message}`);
      if (!to || !message) {
        return { status: 400, body: "Receiver number and message are required" };
      }
  
      try {
        if (!accessToken) {
          await authenticate();
        }
  
        // Format message replacing &newLine& with actual newline
        const formattedMessage = message.replace(/&newLine&/g, '\n');
        context.info(`Formatted message: ${formattedMessage}. \n Sending SMS...`);
        const response = await axios.post(
          `${RC_API_SERVER}/restapi/v1.0/account/~/extension/~/sms`,
          {
            from: { phoneNumber: RC_PHONE_NUMBER },
            to: [{ phoneNumber: to }],
            text: formattedMessage,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        
        context.info("SMS sent successfully!");
        return { 
          status: 200, 
          body: JSON.stringify({ success: true, message: "SMS sent successfully!", data: response.data }) 
        };


      } catch (error) {
        context.error("Error sending SMS:", error.response?.data || error.message);
  
        if (error.response && error.response.status === 401) {
          await refreshAccessToken();
          return { status: 401, body: JSON.stringify({ success: false, message: "Failed to send SMS. Unauthorized" }) };
        }
  
        return { status: 500, body: JSON.stringify({ success: false, message: "Failed to send SMS" }) };
      }
    }
  });