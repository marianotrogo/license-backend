import express from 'express';
import prisma from '../prismaClient.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { email, shortCode } = req.body;
  if (!email || !shortCode) return res.status(400).json({ error: 'missing email or code' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'user not found' });

  const license = await prisma.license.findFirst({
    where: { userId: user.id, token: shortCode, revoked: false }
  });

  if (!license) return res.status(403).json({ ok: false, reason: 'invalid code' });

  // opcional: verificar expiración
  if (license.expiresAt && license.expiresAt < new Date()) {
    return res.status(403).json({ ok: false, reason: 'license expired' });
  }

  res.json({ ok: true, userId: user.id, licenseId: license.id });
});

export default router;
