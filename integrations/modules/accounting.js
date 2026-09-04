// Accounting Integration
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for accounting.
module.exports={id:'accounting',name:'Accounting Integration',configure:(values={})=>({id:'accounting',configured:Object.keys(values).length>0})};
