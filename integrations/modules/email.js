// Transactional Email
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for email.
module.exports={id:'email',name:'Transactional Email',configure:(values={})=>({id:'email',configured:Object.keys(values).length>0})};
