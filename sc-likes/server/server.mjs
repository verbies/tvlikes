import './env.mjs';import express from 'express';import * as core from './core.mjs';
const PORT=process.env.PORT||8787;const app=express();
const send=res=>r=>{if(r.headers)res.set(r.headers);res.status(r.status).json(r.body);};
app.get('/api/likes',async(req,res)=>send(res)(await core.likes(req.query)));
app.get('/api/settings',(req,res)=>send(res)(core.settings()));
app.get('/api/diagnose',async(req,res)=>send(res)(await core.diagnose()));
app.use(express.static('dist'));
app.listen(PORT,()=>console.log('Server ready: http://localhost:'+PORT));
