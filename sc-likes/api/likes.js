import {likes} from '../server/core.mjs';
export default async function handler(req,res){
  const r=await likes(req.query||{});
  res.setHeader('Cache-Control','no-store');
  if(r.headers)for(const[k,v]of Object.entries(r.headers))res.setHeader(k,v);
  res.status(r.status).json(r.body);
}
