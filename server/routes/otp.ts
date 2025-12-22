import { Request, Response } from "express";
import twilio from "twilio";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

let twilioClient: ReturnType<typeof twilio> | null = null;

// Lazy load Twilio to avoid errors if credentials are missing
function getTwilioClient() {
  if (!twilioClient) {
    if (!accountSid || !authToken || !verifySid) {
      throw new Error("Twilio credentials are not configured");
    }
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

/**
 * Send OTP to phone number
 * POST /api/otp/send
 * Body: { phoneNumber: "+91XXXXXXXXXX" }
 */
export async function sendOtp(req: Request, res: Response) {
  try {
    const { phoneNumber } = req.body;

    // Validate phone number
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    // Validate Indian phone format
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Indian phone number format. Use +91XXXXXXXXXX",
      });
    }

    console.log(`[OTP] [MOCK MODE] Sending OTP to ${phoneNumber}`);

    // MOCK MODE - Always return success, use OTP: 123456
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log(`[OTP] [MOCK MODE] OTP is 123456`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully (MOCK: use 123456)",
      verificationSid: "mock_verification_sid",
    });
  } catch (error: any) {
    console.error("[OTP] Error sending OTP:", error);

    // Handle specific Twilio errors
    if (error.code === 20003) {
      return res.status(401).json({
        success: false,
        error: "Twilio authentication failed. Check your credentials.",
      });
    }

    if (error.code === 60200) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to send OTP. Please try again.",
      details: error.message,
    });
  }
}

/**
 * Verify OTP
 * POST /api/otp/verify
 * Body: { phoneNumber: "+91XXXXXXXXXX", code: "123456" }
 */
export async function verifyOtp(req: Request, res: Response) {
  try {
    const { phoneNumber, code } = req.body;

    // Validate inputs
    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        error: "Phone number and code are required",
      });
    }

    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        error: "Invalid code format. Must be 6 digits.",
      });
    }

    console.log(`[OTP] [MOCK MODE] Verifying OTP for ${phoneNumber}`);

    // MOCK MODE - Accept 123456 as valid OTP
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (code === "123456") {
      console.log(`[OTP] [MOCK MODE] OTP verified successfully`);
      return res.status(200).json({
        success: true,
        message: "Phone number verified successfully",
        verified: true,
      });
    } else {
      console.log(`[OTP] [MOCK MODE] Invalid OTP`);
      return res.status(400).json({
        success: false,
        error: "Invalid code. Use 123456 for mock mode.",
        verified: false,
      });
    }
  } catch (error: any) {
    console.error("[OTP] Error verifying OTP:", error);

    // Handle specific Twilio errors
    if (error.code === 20404) {
      return res.status(400).json({
        success: false,
        error: "Verification not found or expired",
      });
    }

    if (error.code === 60202) {
      return res.status(400).json({
        success: false,
        error: "Maximum verification attempts reached",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to verify OTP. Please try again.",
      details: error.message,
    });
  }
}
