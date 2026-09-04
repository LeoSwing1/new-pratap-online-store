// Payment Verification & Webhooks
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for webhooks.
module.exports={id:'webhooks',name:'Payment Verification & Webhooks',configure:(values={})=>({id:'webhooks',configured:Object.keys(values).length>0})};
