import { execSync } from 'child_process';
import os from 'os';
import crypto from 'crypto';


function readMachineGuid(){
try{
const out = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid', { encoding:'utf8' });
const m = out.match(/MachineGuid\s+REG_SZ\s+(.+)/i);
if(m) return m[1].trim();
}catch(e){}
return '';
}


function getPrimaryMac(){
const ifaces = Object.values(os.networkInterfaces()).flat();
const iface = ifaces.find(i=>i && !i.internal && i.mac && i.mac !== '00:00:00:00:00:00');
return iface?.mac || '';
}


export function machineId(){
const mg = readMachineGuid();
const mac = getPrimaryMac();
const raw = `${mg}|${mac}`;
return crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
}