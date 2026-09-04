const http=require('http');http.get('http://127.0.0.1:'+ (process.env.PORT||8787) +'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1));
