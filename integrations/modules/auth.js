// Customer Authentication
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for auth.
module.exports={id:'auth',name:'Customer Authentication',configure:(values={})=>({id:'auth',configured:Object.keys(values).length>0})};
