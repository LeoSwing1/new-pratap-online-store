// Security & Monitoring
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for security.
module.exports={id:'security',name:'Security & Monitoring',configure:(values={})=>({id:'security',configured:Object.keys(values).length>0})};
