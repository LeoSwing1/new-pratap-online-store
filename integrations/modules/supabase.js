// Supabase / PostgreSQL
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for supabase.
module.exports={id:'supabase',name:'Supabase / PostgreSQL',configure:(values={})=>({id:'supabase',configured:Object.keys(values).length>0})};
