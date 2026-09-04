// Payment Gateway
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for payment.
module.exports={id:'payment',name:'Payment Gateway',configure:(values={})=>({id:'payment',configured:Object.keys(values).length>0})};
