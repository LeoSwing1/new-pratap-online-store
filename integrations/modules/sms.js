// SMS / OTP
// Provider credentials are configured server-side through the Integration Control Center.
// This module is the stable contract entry point for sms.
module.exports={id:'sms',name:'SMS / OTP',configure:(values={})=>({id:'sms',configured:Object.keys(values).length>0})};
