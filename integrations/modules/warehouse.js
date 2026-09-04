// Multi-Store & Warehouse
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for warehouse.
module.exports={id:'warehouse',name:'Multi-Store & Warehouse',configure:(values={})=>({id:'warehouse',configured:Object.keys(values).length>0})};
