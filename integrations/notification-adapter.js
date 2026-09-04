export class NotificationAdapter {
  async sendWhatsApp(message) { throw new Error("Configure WhatsApp Business credentials"); }
  async sendEmail(message) { throw new Error("Configure email service"); }
  async sendSms(message) { throw new Error("Configure SMS service"); }
  async sendPush(message) { throw new Error("Configure push notification service"); }
}
