export class PaymentAdapter {
  async createPayment(order) { throw new Error("Configure payment provider on the server"); }
  async verifyPayment(payload) { throw new Error("Configure payment verification"); }
  async refund(paymentId, amount) { throw new Error("Configure refund provider"); }
}
