import express from 'express';
import prisma from '../prismaClient.js';
import authAdmin from '../middleware/authAdmin.js';
import { generateOfflineLicense } from '../utils/licenseGenerator.js';
import dayjs from 'dayjs'; // 👈 Agregar esto

const router = express.Router();

// 🧾 Generar licencia offline
router.post('/generate-offline', authAdmin, async (req, res) => {
  const { userId, machineId, type } = req.body;
  if (!userId || !machineId) return res.status(400).json({ error: 'missing' });

  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) return res.status(404).json({ error: 'user not found' });

  const { token, shortCode } = generateOfflineLicense({
    userId: user.id,
    email: user.email,
    machineId,
    type: type || 'LOCAL',
  });

  const lic = await prisma.license.create({
    data: {
      userId: user.id,
      token,
      machineId,
      type: type || 'LOCAL',
      notes: `Clave corta: ${shortCode}`,
      active: true,
      expiresAt: dayjs().add(30, 'day').toDate(), // 👈 por defecto 30 días
    },
  });

  res.json({
    ok: true,
    licenseId: lic.id,
    shortCode,
    token,
  });
});

// 🔒 Revocar licencia
router.post('/revoke', authAdmin, async (req, res) => {
  const { licenseId } = req.body;
  const lic = await prisma.license.update({
    where: { id: Number(licenseId) },
    data: { revoked: true, revokedAt: new Date(), active: false },
  });
  res.json({ ok: true, lic });
});

// 📋 Listar licencias
router.get('/', authAdmin, async (req, res) => {
  const list = await prisma.license.findMany({ include: { user: true } });
  res.json(list);
});

// 🔁 Renovar licencia (extiende 30 días)
router.post('/renew/:userId', authAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const license = await prisma.license.findFirst({
      where: { userId: Number(userId), revoked: false },
    });

    if (!license) {
      return res.status(404).json({ message: 'No se encontró licencia activa' });
    }

    const newExpiration = dayjs().add(30, 'day').toDate();

    const updated = await prisma.license.update({
      where: { id: license.id },
      data: {
        expiresAt: newExpiration,
        active: true,
      },
    });

    res.json({ message: 'Licencia renovada', updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al renovar licencia' });
  }
});

export default router;
