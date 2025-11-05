import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const startOfMonth = month && year ? new Date(year, month - 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const usersActivos = await prisma.user.count({ where: { active: true } });
    const usersInactivos = await prisma.user.count({ where: { active: false } });
    const licenciasActivas = await prisma.license.count({ where: { revoked: false } });
    const licenciasPorVencer = await prisma.license.count({
      where: {
        revoked: false,
        expiresAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
      },
    });
    const licenciasLifetime = await prisma.license.count({ where: { type: "LIFETIME", revoked: false } });
    const licenciasMensuales = await prisma.license.count({
      where: {
        type: "MONTHLY",
        issuedAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
    });

    res.json({
      usersActivos,
      usersInactivos,
      licenciasActivas,
      licenciasPorVencer,
      licenciasLifetime,
      licenciasMensuales,
    });
  } catch (err) {
    console.error("Error en reportes:", err);
    res.status(500).json({ error: "Error al obtener reportes" });
  }
});

export default router;
