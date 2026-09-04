// Realtime Sync
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for realtime.
module.exports={id:'realtime',name:'Realtime Sync',configure:(values={})=>({id:'realtime',configured:Object.keys(values).length>0})};
