import express from 'express';
import prisma from '../prismaClient.js';
import authAdmin from '../middleware/authAdmin.js';

const router = express.Router();

//  Listar usuarios
router.get('/', authAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    include: { licenses: true, devices: true },
  });
  res.json(users);
});

//  Crear usuario
router.post('/', authAdmin, async (req, res) => {
  try {
    const { email, name, lastName, phone, notes, plan } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es requerido' });
    }

    
    const planValue = plan && plan !== "ELEGIR_DESPUES" ? plan : null;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const created = await prisma.user.create({
      data: {
        email,
        name,
        lastName,
        phone,
        notes,
        plan: planValue,
      },
    });

    res.json(created);
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

//  Obtener usuario
router.get('/:id', authAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({
    where: { id },
    include: { licenses: true, devices: true },
  });
  res.json(user);
});

//  Editar usuario
router.put('/:id', authAdmin, async (req,res)=>{
  const id = Number(req.params.id);
  const data = req.body;
  const updated = await prisma.user.update({where:{id}, data});
  res.json(updated);
});

// Activar / Desactivar usuario
router.put('/:id/toggle-active', authAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { active: !user.active },
    });

    res.json({
      message: updated.active ? 'Usuario activado' : 'Usuario desactivado',
      user: updated,
    });
  } catch (err) {
    console.error('Error al cambiar estado del usuario:', err);
    res.status(500).json({ error: 'Error al cambiar estado del usuario' });
  }
});



export default router;
