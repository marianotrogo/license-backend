// src/routes/licensesOnline.js
import express from 'express';
import prisma from '../prismaClient.js';
import authAdmin from '../middleware/authAdmin.js';
import { generateOfflineLicense } from '../utils/licenseGenerator.js';
import dayjs from 'dayjs';

const router = express.Router();

// Crear licencia online (solo admin)
router.post('/create', authAdmin, async (req, res) => {
  const { userId, machineId, planType } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  // Buscar usuario
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Generar token + shortCode
  const { token, shortCode } = generateOfflineLicense({
    userId: user.id,
    email: user.email,
    machineId: machineId || 'N/A',
    type: planType,
    expiresIn: planType === 'MONTHLY' ? '33d' : '10y' // margen de 3 días
  });

  // Calcular expiración real
  const expiresAt =
    planType === 'MONTHLY'
      ? dayjs().add(33, 'day').toDate()
      : null;

  const license = await prisma.license.create({
    data: {
      userId: user.id,
      token,
      machineId,
      type: planType,
      expiresAt,
      notes: `ShortCode: ${shortCode}`
    }
  });

  // TODO: enviar alerta al admin y/o al cliente por correo (luego lo agregamos)
  res.json({
    ok: true,
    licenseId: license.id,
    shortCode,
    expiresAt
  });
});

export default router;
