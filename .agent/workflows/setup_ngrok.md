---
description: How to set up and run ngrok to expose the backend
---

# Setting up ngrok for Public Access

This workflow helps you expose your local backend (running on port 8000) to the internet, allowing external services (like the Voice Bot, Mobile App, or IoT Webhooks) to communicate with it.

## Option 1: Using NPX (Recommended)

Since you have Node.js installed, the easiest way is to use `npx`.

1.  **Run ngrok for the Backend (Port 8000)**
    This command will download and run ngrok in one step.
    ```bash
    npx ngrok http 8000
    ```

    *Note: If asked to install the package, say yes (y).*

2.  **Copy the Forwarding URL**
    Once running, look for the line that says `Forwarding`. It looks like:
    `https://<random-id>.ngrok-free.app -> http://localhost:8000`

    Copy the `https://...` URL.

## Option 2: Manual Installation

If you prefer installing the standalone executable:

1.  **Download ngrok**: [https://ngrok.com/download](https://ngrok.com/download)
2.  **Unzip** to a folder.
3.  **Authenticate** (Required for free account):
    Log in to dashboard.ngrok.com, go to "Your Authtoken", and run:
    ```bash
    ngrok config add-authtoken <YOUR_TOKEN>
    ```
4.  **Run**:
    ```bash
    ngrok http 8000
    ```

## Post-Setup Configuration

After you have your public URL (e.g., `https://crazy-farming.ngrok-free.app`):

1.  **Update Config**: Index this URL in your frontend config if needed (for API calls from mobile).
2.  **Voice Bot**: Provide this URL to the telephony provider (e.g., Twilio/Vapi) webhook settings.

// turbo
3.  **Test the Connection**:
    Open the forwarded URL in your browser adding `/docs` (e.g., `https://.../docs`) to verify the backend is accessible.
