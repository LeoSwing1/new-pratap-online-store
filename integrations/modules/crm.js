// CRM & Customer Intelligence
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for crm.
module.exports={id:'crm',name:'CRM & Customer Intelligence',configure:(values={})=>({id:'crm',configured:Object.keys(values).length>0})};
