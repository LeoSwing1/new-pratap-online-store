// Analytics
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for analytics.
module.exports={id:'analytics',name:'Analytics',configure:(values={})=>({id:'analytics',configured:Object.keys(values).length>0})};
