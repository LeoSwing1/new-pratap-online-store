// Automated Backups & Recovery
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for backup.
module.exports={id:'backup',name:'Automated Backups & Recovery',configure:(values={})=>({id:'backup',configured:Object.keys(values).length>0})};
