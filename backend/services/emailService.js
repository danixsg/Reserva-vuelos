const nodemailer = require("nodemailer");

/**
 * Envía un correo electrónico usando Nodemailer.
 * Requiere configurar EMAIL_USER y EMAIL_PASS en backend/.env.
 */
async function sendEmail({ to, subject, html, attachments = [] }) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      "Falta configurar EMAIL_USER y EMAIL_PASS en el archivo backend/.env"
    );
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from: `"AereoSky" <${user}>`,
    to,
    subject,
    html,
  };

  if (attachments.length > 0) {
    mailOptions.attachments = attachments.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType || "application/pdf",
    }));
  }

  return await transporter.sendMail(mailOptions);
}

function formatFecha(fecha) {
  if (!fecha) return "Por confirmar";
  return new Date(fecha).toLocaleString("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function buildReservaEmailHtml(info) {
  const nombre = [info.p_nombre, info.p_apellido].filter(Boolean).join(" ") || "Viajero";
  const total =
    Number(info.precio_base || 0) + Number(info.precio_categoria || 0);

  return `
    <!DOCTYPE html>
    <html lang="es">
      <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
        <div style="max-width:600px;margin:28px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:#0f172a;color:#ffffff;padding:24px 28px;text-align:center;">
            <h1 style="margin:0;font-size:22px;letter-spacing:0.5px;">AereoSky</h1>
            <p style="margin:6px 0 0;font-size:13px;color:#93c5fd;">Confirmación de Reserva</p>
          </div>
          <div style="padding:28px;">
            <p style="margin:0 0 12px;font-size:15px;">Hola <strong>${nombre}</strong>,</p>
            <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
              Tu reserva ha sido registrada exitosamente en <strong>AereoSky</strong>. Aquí tienes el resumen de tu vuelo:
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:20px;">
              <p style="margin:0 0 8px;font-size:13px;"><strong>Código de Reserva:</strong> #${info.id_reserva}</p>
              <p style="margin:0 0 8px;font-size:13px;"><strong>Ruta:</strong> ${info.origen_ciudad} (${info.origen_codigo}) → ${info.destino_ciudad} (${info.destino_codigo})</p>
              <p style="margin:0 0 8px;font-size:13px;"><strong>Aerolínea:</strong> ${info.nombre_aerolinea} (${info.codigo_aerolinea})</p>
              <p style="margin:0 0 8px;font-size:13px;"><strong>Salida:</strong> ${formatFecha(info.fecha_salida)}</p>
              <p style="margin:0 0 8px;font-size:13px;"><strong>Llegada:</strong> ${formatFecha(info.fecha_llegada)}</p>
              <p style="margin:0 0 8px;font-size:13px;"><strong>Categoría:</strong> ${info.nombre_categoria || "Estándar"}</p>
              <p style="margin:0 0 8px;font-size:13px;"><strong>Estado:</strong> ${info.estado_reserva}</p>
              <p style="margin:0;font-size:14px;color:#1d4ed8;"><strong>Total estimado:</strong> $${total.toFixed(2)}</p>
            </div>
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
              Puedes revisar el estado de tu reserva y completar tu pago en cualquier momento desde la sección <strong>Mis Reservas</strong>.
            </p>
          </div>
          <div style="background:#f8fafc;padding:16px 28px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">
            Este es un mensaje automático de AereoSky. Por favor, no respondas a este correo.
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildRecuperacionEmailHtml({ nombre, enlaceRecuperacion }) {
  return `
    <!DOCTYPE html>
    <html lang="es">
      <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
        <div style="max-width:600px;margin:28px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:#0f172a;color:#ffffff;padding:24px 28px;text-align:center;">
            <h1 style="margin:0;font-size:22px;letter-spacing:0.5px;">AereoSky</h1>
            <p style="margin:6px 0 0;font-size:13px;color:#93c5fd;">Recuperación de Contraseña</p>
          </div>
          <div style="padding:28px;text-align:center;">
            <p style="margin:0 0 12px;font-size:15px;">Hola <strong>${nombre || "usuario"}</strong>,</p>
            <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
              Hemos recibido una solicitud para restablecer tu contraseña en <strong>AereoSky</strong>. Haz clic en el siguiente botón para continuar:
            </p>
            <a href="${enlaceRecuperacion}" style="display:inline-block;padding:12px 28px;background-color:#1d4ed8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;border-radius:8px;">
              Recuperar contraseña
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:#64748b;">
              Si tú no realizaste esta solicitud, puedes ignorar este mensaje.
            </p>
          </div>
          <div style="background:#f8fafc;padding:16px 28px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">
            Este es un mensaje automático de AereoSky. Por favor, no respondas a este correo.
          </div>
        </div>
      </body>
    </html>
  `;
}

module.exports = {
  sendEmail,
  buildReservaEmailHtml,
  buildRecuperacionEmailHtml,
};
