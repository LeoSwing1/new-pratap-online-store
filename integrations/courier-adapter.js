export class CourierAdapter {
  async createShipment(order) { throw new Error("Configure courier credentials"); }
  async getTracking(awb) { throw new Error("Configure courier tracking"); }
  async cancelShipment(shipmentId) { throw new Error("Configure courier"); }
}
