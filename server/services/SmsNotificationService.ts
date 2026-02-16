import twilio from "twilio";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: ReturnType<typeof twilio> | null = null;

// Lazy load Twilio to avoid errors if credentials are missing
function getTwilioClient() {
  if (!twilioClient) {
    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials are not configured");
    }
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export class SmsNotificationService {
  /**
   * Check if Twilio SMS is configured
   */
  static isConfigured(): boolean {
    return !!(accountSid && authToken && twilioPhoneNumber);
  }

  /**
   * Send generic SMS
   */
  static async sendSms(to: string, message: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.log(`[SMS] [MOCK MODE] Would send to ${to}: ${message}`);
        return true;
      }

      const client = getTwilioClient();
      const result = await client.messages.create({
        body: message,
        from: twilioPhoneNumber!,
        to: to,
      });

      console.log(`[SMS] Message sent successfully. SID: ${result.sid}`);
      return true;
    } catch (error: any) {
      console.error("[SMS] Error sending SMS:", error.message);
      return false;
    }
  }

  /**
   * Send AI Recommendation Notification
   * Called when new AI recommendations are generated
   */
  static async sendAiRecommendationNotification(
    phoneNumber: string,
    userName: string,
    recommendationType: string,
    summary: string
  ): Promise<boolean> {
    const message = `🌾 Smart Farming Alert

Hi ${userName},

New AI Recommendation: ${recommendationType}

${summary.substring(0, 120)}...

Login to view full details: ${process.env.FRONTEND_URL || 'https://yourapp.com'}

- Smart Farming Team`;

    console.log(`[SMS] Sending AI recommendation notification to ${phoneNumber}`);
    return await this.sendSms(phoneNumber, message);
  }

  /**
   * Send Voice Call Notification
   * Called when someone tries to call the user
   */
  static async sendVoiceCallNotification(
    phoneNumber: string,
    callerName: string,
    callerPhone?: string
  ): Promise<boolean> {
    const message = `📞 Incoming Voice Call

${callerName} is trying to reach you via voice call.

${callerPhone ? `Callback: ${callerPhone}` : ''}

Login to answer: ${process.env.FRONTEND_URL || 'https://yourapp.com'}/chat

- Smart Farming`;

    console.log(`[SMS] Sending voice call notification to ${phoneNumber}`);
    return await this.sendSms(phoneNumber, message);
  }

  /**
   * Send Video Call Notification
   * Called when someone tries to video call the user
   */
  static async sendVideoCallNotification(
    phoneNumber: string,
    callerName: string,
    callerPhone?: string
  ): Promise<boolean> {
    const message = `📹 Incoming Video Call

${callerName} wants to video call you.

${callerPhone ? `Callback: ${callerPhone}` : ''}

Login to answer: ${process.env.FRONTEND_URL || 'https://yourapp.com'}/chat

- Smart Farming`;

    console.log(`[SMS] Sending video call notification to ${phoneNumber}`);
    return await this.sendSms(phoneNumber, message);
  }

  /**
   * Send Chat Message Notification
   * Called when user receives a new chat message and is offline
   */
  static async sendChatMessageNotification(
    phoneNumber: string,
    senderName: string,
    messagePreview: string
  ): Promise<boolean> {
    const preview = messagePreview.length > 80 
      ? messagePreview.substring(0, 80) + "..." 
      : messagePreview;

    const message = `💬 New Message

${senderName}: ${preview}

Reply: ${process.env.FRONTEND_URL || 'https://yourapp.com'}/chat

- Smart Farming`;

    console.log(`[SMS] Sending chat message notification to ${phoneNumber}`);
    return await this.sendSms(phoneNumber, message);
  }

  /**
   * Send Critical Weather Alert
   * Called for urgent weather warnings
   */
  static async sendWeatherAlert(
    phoneNumber: string,
    userName: string,
    alertType: string,
    alertMessage: string
  ): Promise<boolean> {
    const message = `⚠️ Weather Alert

Hi ${userName},

${alertType}: ${alertMessage}

Take immediate action. Check details: ${process.env.FRONTEND_URL || 'https://yourapp.com'}/weather

- Smart Farming`;

    console.log(`[SMS] Sending weather alert to ${phoneNumber}`);
    return await this.sendSms(phoneNumber, message);
  }

  /**
   * Send Irrigation Reminder
   * Called when AI detects irrigation is needed
   */
  static async sendIrrigationReminder(
    phoneNumber: string,
    userName: string,
    cropName: string,
    urgency: string
  ): Promise<boolean> {
    const message = `💧 Irrigation Alert

Hi ${userName},

Your ${cropName} needs watering (${urgency} priority).

Check AI recommendations: ${process.env.FRONTEND_URL || 'https://yourapp.com'}/recommendations

- Smart Farming`;

    console.log(`[SMS] Sending irrigation reminder to ${phoneNumber}`);
    return await this.sendSms(phoneNumber, message);
  }

  /**
   * Send Fertilizer Application Reminder
   */
  static async sendFertilizerReminder(
    phoneNumber: string,
    userName: string,
    cropName: string,
    fertilizerType: string
  ): Promise<boolean> {
    const message = `🌱 Fertilizer Reminder

Hi ${userName},

Apply ${fertilizerType} to your ${cropName} today.

View full instructions: ${process.env.FRONTEND_URL || 'https://yourapp.com'}/recommendations

- Smart Farming`;

    console.log(`[SMS] Sending fertilizer reminder to ${phoneNumber}`);
    return await this.sendSms(phoneNumber, message);
  }

  /**
   * Send Pest Alert
   */
  static async sendPestAlert(
    phoneNumber: string,
    userName: string,
    pestName: string,
    cropName: string
  ): Promise<boolean> {
    const message = `🐛 Pest Alert

Hi ${userName},

${pestName} detected in ${cropName} crops!

Get treatment recommendations: ${process.env.FRONTEND_URL || 'https://yourapp.com'}/recommendations

- Smart Farming`;

    console.log(`[SMS] Sending pest alert to ${phoneNumber}`);
    return await this.sendSms(phoneNumber, message);
  }

  /**
   * Send Harvest Ready Notification
   */
  static async sendHarvestNotification(
    phoneNumber: string,
    userName: string,
    cropName: string,
    estimatedDays: number
  ): Promise<boolean> {
    const message = `🌾 Harvest Alert

Hi ${userName},

Your ${cropName} will be ready for harvest in approximately ${estimatedDays} days!

View details: ${process.env.FRONTEND_URL || 'https://yourapp.com'}/farm

- Smart Farming`;

    console.log(`[SMS] Sending harvest notification to ${phoneNumber}`);
    return await this.sendSms(phoneNumber, message);
  }
}
