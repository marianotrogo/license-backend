import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();


export default function authAdmin(req,res,next){
const auth = req.headers.authorization;
if(!auth) return res.status(401).json({error: 'no token'});
const token = auth.split(' ')[1];
try{
const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
req.admin = payload;
next();
}catch(e){
return res.status(401).json({error:'invalid token'});
}
}