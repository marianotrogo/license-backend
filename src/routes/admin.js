import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';
import dotenv from 'dotenv';
dotenv.config();


const router = express.Router();


router.post('/login', async (req,res)=>{
const {email,password} = req.body;
const admin = await prisma.admin.findUnique({where:{email}});
if(!admin) return res.status(401).json({error:'invalid'});
const ok = await bcrypt.compare(password, admin.password);
if(!ok) return res.status(401).json({error:'invalid'});
const token = jwt.sign({id: admin.id, email: admin.email, role: admin.role}, process.env.ADMIN_JWT_SECRET, {expiresIn: '12h'});
res.json({token});
});


// create admin (only for initial bootstrap) - remove or protect later
router.post('/create', async (req,res)=>{
const {email,password,name,role} = req.body;
const hashed = await bcrypt.hash(password,12);
const created = await prisma.admin.create({data:{email,password:hashed,name,role}});
res.json({ok:true, admin: {id: created.id, email: created.email}});
});


export default router;