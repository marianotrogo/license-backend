import cron from "node-cron";
import fs from "fs";
import path from "path";
import dayjs from "dayjs";
import prisma from "../prismaClient.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// 📁 Ruta para logs
const logPath = path.resolve("logs/reminders.log");
if (!fs.existsSync(path.dirname(logPath))) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
}

function logMessage(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logPath, line);
  console.log(line.trim());
}

// 📧 Configuración SMTP
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false, // true si usás puerto 465
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// 📦 Plantilla HTML
function buildEmailTemplate(user, license, daysLeft) {
  const formattedDate = dayjs(license.expiresAt).format("DD/MM/YYYY");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Recordatorio de Licencia</title>
<style>
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background-color: #f4f6f8;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 30px auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  .header {
    background: #2563eb;
    color: white;
    padding: 20px;
    text-align: center;
  }
  .content {
    padding: 25px;
    color: #333;
  }
  .footer {
    font-size: 13px;
    color: #888;
    text-align: center;
    padding: 15px;
  }
  .button {
    display: inline-block;
    background: #2563eb;
    color: white;
    text-decoration: none;
    padding: 10px 18px;
    border-radius: 6px;
    font-weight: bold;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <!-- 🖼️ ACA PODÉS AGREGAR TU LOGO -->
      <!-- <img src="https://tuservidor.com/logo.png" alt="Logo" width="120" /> -->
      <h2>Recordatorio de Licencia</h2>
    </div>
    <div class="content">
      <p>Hola <strong>${user.name || user.email}</strong>,</p>
      <p>Queremos informarte que tu licencia <strong>(${license.type})</strong> del sistema POS Indum vencerá en <strong>${daysLeft} día${daysLeft > 1 ? "s" : ""}</strong>.</p>
      <p><b>Fecha de vencimiento:</b> ${formattedDate}</p>
      <p>Por favor, contactá con soporte para renovarla antes del vencimiento y evitar interrupciones.</p>
      <p style="text-align:center; margin-top: 25px;">
        <a href="mailto:${process.env.MAIL_USER}" class="button">Contactar soporte</a>
      </p>
    </div>
    <div class="footer">
      <p>Este mensaje se generó automáticamente. No respondas directamente a este correo.</p>
      <p>&copy; ${new Date().getFullYear()} POS Indum</p>
    </div>
  </div>
</body>
</html>
`;
}

// 📨 Función que envía el correo
async function sendReminderEmail(user, license) {
  const daysLeft = dayjs(license.expiresAt).diff(dayjs(), "day");

  const subject = `⚠️ Tu licencia vence en ${daysLeft} día${daysLeft > 1 ? "s" : ""}`;
  const textMessage = `
Hola ${user.name || user.email},

Tu licencia del sistema POS Indum (${license.type}) vence el ${dayjs(
    license.expiresAt
  ).format("DD/MM/YYYY")}.

Por favor, contactá con soporte para renovarla antes del vencimiento.

Saludos,
Equipo POS Indum.
`;

  const htmlMessage = buildEmailTemplate(user, license, daysLeft);

  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"POS Indum" <${process.env.MAIL_USER}>`,
    to: user.email,
    subject,
    text: textMessage,
    html: htmlMessage,
  });

  logMessage(`📧 Recordatorio enviado a ${user.email}`);
}

// 🧠 Revisa licencias próximas a vencer
async function checkExpiringLicenses() {
  logMessage("🔍 Buscando licencias próximas a vencer...");

  const now = dayjs();
  const limit = now.add(5, "day").toDate();

  const licenses = await prisma.license.findMany({
    where: {
      revoked: false,
      expiresAt: { lte: limit, gte: now.toDate() },
    },
    include: { user: true },
  });

  if (licenses.length === 0) {
    logMessage("✅ No hay licencias próximas a vencer.");
    return;
  }

  for (const lic of licenses) {
    try {
      await sendReminderEmail(lic.user, lic);
    } catch (err) {
      logMessage(`❌ Error enviando a ${lic.user.email}: ${err.message}`);
    }
  }
}

// ⏰ Ejecutar todos los días a las 09:00 y 17:00
cron.schedule("0 9,17 * * *", () => {
  checkExpiringLicenses().catch((err) =>
    logMessage("Error en job: " + err.message)
  );
});

logMessage("🚀 Recordatorio de licencias activo (09:00 y 17:00)");
