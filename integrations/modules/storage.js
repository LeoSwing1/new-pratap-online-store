// Cloud Storage
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for storage.
module.exports={id:'storage',name:'Cloud Storage',configure:(values={})=>({id:'storage',configured:Object.keys(values).length>0})};
