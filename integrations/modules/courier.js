// Courier & Shipment
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for courier.
module.exports={id:'courier',name:'Courier & Shipment',configure:(values={})=>({id:'courier',configured:Object.keys(values).length>0})};
