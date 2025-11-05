import express from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from '../prismaClient.js';


dotenv.config();
const PUBLIC_KEY = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, 'utf8');
const router = express.Router();


router.post('/', async (req,res)=>{
const { token } = req.body;
if(!token) return res.status(400).json({ error:'missing token' });
try{
const payload = jwt.verify(token, PUBLIC_KEY, { algorithms:['RS256'] });
// check DB if revoked
const lic = await prisma.license.findFirst({ where: { token } });
if(lic && lic.revoked) return res.status(403).json({ ok:false, reason:'revoked' });
return res.json({ ok:true, payload });
}catch(e){
return res.status(400).json({ ok:false, error: e.message });
}
});


export default router;