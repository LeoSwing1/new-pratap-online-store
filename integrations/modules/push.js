// Browser Push / FCM
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for push.
module.exports={id:'push',name:'Browser Push / FCM',configure:(values={})=>({id:'push',configured:Object.keys(values).length>0})};
