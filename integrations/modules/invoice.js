// Invoice & GST
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for invoice.
module.exports={id:'invoice',name:'Invoice & GST',configure:(values={})=>({id:'invoice',configured:Object.keys(values).length>0})};
