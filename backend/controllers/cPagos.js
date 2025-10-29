const pool = require("../db/pool");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

// ========== HELPERS TARJETA ==========
function maskCard(num) {
  const last4 = (num || "").slice(-4);
  return "**** **** **** " + last4;
}

function detectCardBrand(digits) {
  if (/^4/.test(digits)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "MASTERCARD";
  if (/^3[47]/.test(digits)) return "AMEX";
  return "DESCONOCIDA";
}

// ========== PDF HELPERS ==========
function drawRoundedRect(doc, x, y, w, h, r) {
  doc
    .moveTo(x + r, y)
    .lineTo(x + w - r, y)
    .quadraticCurveTo(x + w, y, x + w, y + r)
    .lineTo(x + w, y + h - r)
    .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    .lineTo(x + r, y + h)
    .quadraticCurveTo(x, y + h, x, y + h - r)
    .lineTo(x, y + r)
    .quadraticCurveTo(x, y, x + r, y)
    .closePath();
}

// -------- factura PDF --------
async function generarPDFFactura(info) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => {
        resolve({
          filename: `Factura_${info.id_factura}.pdf`,
          buffer: Buffer.concat(chunks),
        });
      });

      const azulPrimario = "#0066ff";
      const grisFondoBox = "#f8fafc";
      const grisBordeBox = "#e5e7eb";
      const grisTextoSec = "#6b7280";
      const grisTexto = "#1f2937";

      // HEADER degradado
      const headerH = 90;
      const grad = doc
        .linearGradient(0, 0, 600, 0)
        .stop(0, "#004bff")
        .stop(1, "#00aaff");

      doc.save();
      doc.rect(0, 0, doc.page.width, headerH);
      doc.fill(grad);
      doc.restore();

      doc
        .fillColor("#ffffff")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("AereoSky", 40, 28);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#ffffff")
        .text("Factura electrónica", 40, 56);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#ffffff")
        .text(`Factura #: ${info.id_factura}`, doc.page.width - 200, 28, {
          width: 160,
          align: "right",
        })
        .text(`Compra #: ${info.id_compra}`, doc.page.width - 200, 42, {
          width: 160,
          align: "right",
        })
        .text(
          `Fecha emisión: ${info.fecha_emision}`,
          doc.page.width - 200,
          56,
          { width: 160, align: "right" }
        );

      doc.y = headerH + 24;

      // DATOS CLIENTE
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor(grisTexto)
        .text("Datos del cliente", 40, doc.y);

      const boxX = 40;
      const boxY = doc.y + 20;
      const boxW = doc.page.width - 80;
      const boxH = 90;
      const innerPad = 16;

      doc.save();
      drawRoundedRect(doc, boxX, boxY, boxW, boxH, 10);
      doc.fillColor(grisFondoBox).strokeColor(grisBordeBox).lineWidth(1);
      doc.fillAndStroke();
      doc.restore();

      doc
        .fillColor(grisTexto)
        .font("Helvetica")
        .fontSize(11)
        .text(
          `Nombre: ${info.p_nombre || "Cliente"}`,
          boxX + innerPad,
          boxY + innerPad
        )
        .text(`Correo: ${info.correo}`, boxX + innerPad, boxY + innerPad + 16)
        .text(
          `Método entrega billete: ${info.metodo_entrega_billete}`,
          boxX + innerPad,
          boxY + innerPad + 32
        )
        .text(
          `Fecha de compra: ${info.fecha_compra}`,
          boxX + innerPad,
          boxY + innerPad + 48
        );

      doc.y = boxY + boxH + 30;

      // DETALLE DE PAGO
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor(grisTexto)
        .text("Detalle de pago", 40, doc.y);

      const tablaX = 40;
      const tablaY = doc.y + 16;
      const tablaW = doc.page.width - 80;
      const tablaH = 110;

      doc.save();
      drawRoundedRect(doc, tablaX, tablaY, tablaW, tablaH, 10);
      doc.fillColor("#ffffff").strokeColor(grisBordeBox).lineWidth(1);
      doc.fillAndStroke();
      doc.restore();

      doc
        .strokeColor(grisBordeBox)
        .lineWidth(1)
        .moveTo(tablaX, tablaY + 36)
        .lineTo(tablaX + tablaW, tablaY + 36)
        .stroke()
        .moveTo(tablaX, tablaY + 72)
        .lineTo(tablaX + tablaW, tablaY + 72)
        .stroke();

      const labelOpts = { width: tablaW - 32, align: "left" };
      const valueOpts = { width: tablaW - 32, align: "right" };

      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(grisTextoSec)
        .text("Subtotal", tablaX + 16, tablaY + 12, labelOpts);
      doc
        .font("Helvetica-Bold")
        .fillColor(grisTexto)
        .text(
          "$" + Number(info.factura_total).toFixed(2),
          tablaX + 16,
          tablaY + 12,
          valueOpts
        );

      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(grisTextoSec)
        .text("Impuestos (IVA 12%)", tablaX + 16, tablaY + 48, labelOpts);
      doc
        .font("Helvetica-Bold")
        .fillColor(grisTexto)
        .text(
          "$" + Number(info.impuestos).toFixed(2),
          tablaX + 16,
          tablaY + 48,
          valueOpts
        );

      const totalPagado = (
        Number(info.factura_total) + Number(info.impuestos)
      ).toFixed(2);

      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(grisTextoSec)
        .text("Total pagado", tablaX + 16, tablaY + 84, labelOpts);
      doc
        .font("Helvetica-Bold")
        .fillColor(azulPrimario)
        .fontSize(14)
        .text("$" + totalPagado, tablaX + 16, tablaY + 80, valueOpts);

      doc.y = tablaY + tablaH + 30;

      // INFO DEL VUELO
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor(grisTexto)
        .text("Información del vuelo", 40, doc.y);

      const vueloY = doc.y + 16;
      const vueloH = 130;

      doc.save();
      drawRoundedRect(doc, boxX, vueloY, boxW, vueloH, 10);
      doc.fillColor(grisFondoBox).strokeColor(grisBordeBox).lineWidth(1);
      doc.fillAndStroke();
      doc.restore();

      doc
        .fillColor(grisTexto)
        .font("Helvetica")
        .fontSize(11)
        .text(
          `Aerolínea: ${info.nombre_aerolinea} (${info.codigo_aerolinea})`,
          boxX + innerPad,
          vueloY + innerPad
        )
        .text(
          `Ruta: ${info.origen_ciudad} (${info.origen_codigo}) → ${info.destino_ciudad} (${info.destino_codigo})`,
          boxX + innerPad,
          vueloY + innerPad + 16
        )
        .text(
          `Salida: ${info.fecha_salida}`,
          boxX + innerPad,
          vueloY + innerPad + 32
        )
        .text(
          `Llegada: ${info.fecha_llegada}`,
          boxX + innerPad,
          vueloY + innerPad + 48
        )
        .text(
          `Estado vuelo: ${info.estado_vuelo}`,
          boxX + innerPad,
          vueloY + innerPad + 64
        )
        .text(
          `Asiento asignado: ${info.numero_asiento}`,
          boxX + innerPad,
          vueloY + innerPad + 80
        );

      doc.y = vueloY + vueloH + 40;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(grisTextoSec)
        .text(
          "Este documento sirve como comprobante de compra. Gracias por elegir AereoSky.",
          { align: "center" }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// -------- billete PDF --------
async function generarPDFBillete(info) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => {
        resolve({
          filename: `Billete_${info.id_billete}.pdf`,
          buffer: Buffer.concat(chunks),
        });
      });

      const azulFuerte = "#0b1f4a";
      const azulClaro = "#4f8cff";
      const grisClaro = "#f9fafb";
      const grisBorde = "#d1d5db";
      const grisTexto = "#1f2937";
      const grisSec = "#6b7280";

      const headerH = 120;
      doc.save();
      doc.rect(0, 0, doc.page.width, headerH).fill(azulFuerte);
      doc.restore();

      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(24)
        .text("AereoSky Boarding Pass", 40, 30);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#cbd5e1")
        .text("Billete electrónico - Presentar en el aeropuerto", 40, 60);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#ffffff")
        .text(`Billete #: ${info.id_billete}`, doc.page.width - 200, 30, {
          width: 160,
          align: "right",
        })
        .text(`Asiento: ${info.numero_asiento}`, doc.page.width - 200, 46, {
          width: 160,
          align: "right",
        })
        .text(
          `Pasajero: ${info.p_nombre || "Pasajero"}`,
          doc.page.width - 200,
          62,
          { width: 160, align: "right" }
        );

      const cardX = 40;
      const cardW = doc.page.width - 80;
      const cardH = 250;
      const cardY = headerH + 30;
      const innerPad = 20;
      const rightX = cardX + cardW / 2 + 10;

      doc.save();
      drawRoundedRect(doc, cardX, cardY, cardW, cardH, 16);
      doc.fillColor(grisClaro).strokeColor(grisBorde).lineWidth(1);
      doc.fillAndStroke();
      doc.restore();

      // origen
      doc
        .fillColor(grisTexto)
        .font("Helvetica-Bold")
        .fontSize(28)
        .text(info.origen_codigo || "XXX", cardX + innerPad, cardY + innerPad, {
          width: cardW / 2 - innerPad,
          align: "left",
        });

      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(grisSec)
        .text(
          info.origen_ciudad || "",
          cardX + innerPad,
          cardY + innerPad + 36,
          { width: cardW / 2 - innerPad, align: "left" }
        );

      doc
        .strokeColor(azulClaro)
        .lineWidth(2)
        .moveTo(cardX + innerPad, cardY + innerPad + 60)
        .lineTo(cardX + innerPad + 80, cardY + innerPad + 60)
        .stroke();

      // destino
      doc
        .font("Helvetica-Bold")
        .fontSize(28)
        .fillColor(grisTexto)
        .text(
          info.destino_codigo || "YYY",
          cardX + innerPad,
          cardY + innerPad + 70,
          { width: cardW / 2 - innerPad, align: "left" }
        );

      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(grisSec)
        .text(
          info.destino_ciudad || "",
          cardX + innerPad,
          cardY + innerPad + 106,
          { width: cardW / 2 - innerPad, align: "left" }
        );

      // derecha
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(grisTexto)
        .text("Aerolínea", rightX, cardY + innerPad, {
          width: cardW / 2 - innerPad * 2,
          align: "left",
        })
        .font("Helvetica")
        .fontSize(11)
        .fillColor(grisSec)
        .text(
          `${info.nombre_aerolinea} (${info.codigo_aerolinea})`,
          rightX,
          cardY + innerPad + 16,
          { width: cardW / 2 - innerPad * 2, align: "left" }
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(grisTexto)
        .text("Salida", rightX, cardY + innerPad + 48, {
          width: cardW / 2 - innerPad * 2,
          align: "left",
        })
        .font("Helvetica")
        .fontSize(11)
        .fillColor(grisSec)
        .text(`${info.fecha_salida}`, rightX, cardY + innerPad + 64, {
          width: cardW / 2 - innerPad * 2,
          align: "left",
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(grisTexto)
        .text("Llegada", rightX, cardY + innerPad + 96, {
          width: cardW / 2 - innerPad * 2,
          align: "left",
        })
        .font("Helvetica")
        .fontSize(11)
        .fillColor(grisSec)
        .text(`${info.fecha_llegada}`, rightX, cardY + innerPad + 112, {
          width: cardW / 2 - innerPad * 2,
          align: "left",
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(grisTexto)
        .text("Estado vuelo", rightX, cardY + innerPad + 144, {
          width: cardW / 2 - innerPad * 2,
          align: "left",
        })
        .font("Helvetica")
        .fontSize(11)
        .fillColor(info.estado_vuelo === "Programado" ? azulClaro : grisSec)
        .text(info.estado_vuelo, rightX, cardY + innerPad + 160, {
          width: cardW / 2 - innerPad * 2,
          align: "left",
        });

      // badge asiento
      const badgeX = cardX + innerPad;
      const badgeY = cardY + cardH - 80;
      const badgeW = 140;
      const badgeH = 50;

      doc.save();
      drawRoundedRect(doc, badgeX, badgeY, badgeW, badgeH, 8);
      doc.fillColor(azulClaro).strokeColor(azulClaro).lineWidth(1);
      doc.fillAndStroke();
      doc.restore();

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#ffffff")
        .text("ASIENTO", badgeX + 12, badgeY + 10);

      doc
        .font("Helvetica-Bold")
        .fontSize(24)
        .fillColor("#ffffff")
        .text(info.numero_asiento || "-", badgeX + 12, badgeY + 20);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(grisSec)
        .text(
          "Preséntate 2h antes con documento de identidad.",
          rightX,
          badgeY + 8,
          { width: cardW / 2 - innerPad * 2, align: "left" }
        );

      doc.y = cardY + cardH + 30;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(grisSec)
        .text(
          "Este billete es válido solo para el pasajero indicado y es intransferible.",
          { align: "center" }
        )
        .moveDown(0.5)
        .fillColor(azulFuerte)
        .text("Gracias por volar con AereoSky ✈", {
          align: "center",
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ========== EMAIL BUILDERS ==========

// factura + billete (entrega electrónica)
async function enviarCorreoCompraInternal(id_compra) {
  // saco la info necesaria
  const queryInfo = `
    SELECT
      c.id_compra,
      c.fecha_compra,
      c.metodo_entrega_billete,
      c.monto_total,

      f.id_factura,
      f.fecha_emision,
      f.monto_total AS factura_total,
      f.impuestos,

      b.id_billete,
      b.numero_asiento,

      u.id_usuario,
      u.p_nombre,
      u.correo,

      v.id_vuelo,
      v.fecha_salida,
      v.fecha_llegada,
      v.tipo_vuelo,
      v.asientos_disponibles,
      v.precio            AS precio_base,
      v.estado            AS estado_vuelo,

      ori.nombre          AS origen_ciudad,
      ori.codigo_iata     AS origen_codigo,
      dest.nombre         AS destino_ciudad,
      dest.codigo_iata    AS destino_codigo,

      aer.nombre_aerolinea,
      aer.codigo_aerolinea
    FROM compra c
    JOIN factura f ON f.id_compra = c.id_compra
    JOIN billete b ON b.id_compra = c.id_compra
    JOIN reserva r ON r.id_reserva = c.id_reserva
    JOIN usuario u ON u.id_usuario = r.id_usuario
    JOIN vuelo v ON v.id_vuelo = r.id_vuelo
    JOIN ciudad ori ON ori.id_ciudad = v.id_ciudad_origen
    JOIN ciudad dest ON dest.id_ciudad = v.id_ciudad_destino
    JOIN aerolinea aer ON aer.id_aerolinea = v.id_aerolinea
    WHERE c.id_compra = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(queryInfo, [id_compra]);
  if (rows.length === 0) {
    throw new Error("No se encontró info de la compra para enviar correo");
  }
  const info = rows[0];

  const facturaPDF = await generarPDFFactura(info);
  const billetePDF = await generarPDFBillete(info);

  const htmlCorreo = `
    <html>
      <body style="font-family:Arial, sans-serif; background:#f4f4f9; color:#333; padding:20px;">
        <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px;">
          <div style="text-align:center; border-bottom:1px solid #e5e7eb; padding-bottom:16px; margin-bottom:16px;">
            <h2 style="margin:0; color:#0066ff;">AereoSky</h2>
            <p style="margin:4px 0 0 0; font-size:14px; color:#555;">
              ¡Gracias por tu compra ${info.p_nombre || ""}!
            </p>
          </div>

          <p style="font-size:15px; line-height:1.5; color:#444;">
            Tu compra ha sido confirmada. Te adjuntamos tu <strong>Factura</strong> y tu <strong>Billete electrónico</strong> en formato PDF.
          </p>

          <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:12px 16px; font-size:14px; line-height:1.4; margin-top:16px;">
            <div><strong>Ruta:</strong> ${info.origen_ciudad} (${info.origen_codigo}) → ${info.destino_ciudad} (${info.destino_codigo})</div>
            <div><strong>Aerolínea:</strong> ${info.nombre_aerolinea} (${info.codigo_aerolinea})</div>
            <div><strong>Salida:</strong> ${info.fecha_salida}</div>
            <div><strong>Llegada:</strong> ${info.fecha_llegada}</div>
            <div><strong>Asiento asignado:</strong> ${info.numero_asiento}</div>
          </div>

          <p style="font-size:13px; color:#666; margin-top:20px;">
            Presenta tu billete electrónico y documento de identidad válido al momento del abordaje.
          </p>

          <p style="font-size:12px; color:#999; text-align:center; margin-top:32px;">
            Este es un mensaje automático. Por favor no respondas directamente.
            <br/>AereoSky © 2025
          </p>
        </div>
      </body>
    </html>
  `;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: info.correo,
    subject: "Tu billete y factura - AereoSky",
    html: htmlCorreo,
    attachments: [
      {
        filename: facturaPDF.filename,
        content: facturaPDF.buffer,
        contentType: "application/pdf",
      },
      {
        filename: billetePDF.filename,
        content: billetePDF.buffer,
        contentType: "application/pdf",
      },
    ],
  });

  return {
    correoEnviadoA: info.correo,
    id_compra: info.id_compra,
    id_factura: info.id_factura,
    id_billete: info.id_billete,
  };
}

// solo factura (retiro en aeropuerto)
async function enviarCorreoFacturaInternal(id_compra) {
  const queryInfo = `
    SELECT
      c.id_compra,
      c.fecha_compra,
      c.metodo_entrega_billete,
      c.monto_total,

      f.id_factura,
      f.fecha_emision,
      f.monto_total AS factura_total,
      f.impuestos,

      u.id_usuario,
      u.p_nombre,
      u.correo,

      v.fecha_salida,
      v.fecha_llegada,
      ori.nombre          AS origen_ciudad,
      ori.codigo_iata     AS origen_codigo,
      dest.nombre         AS destino_ciudad,
      dest.codigo_iata    AS destino_codigo,
      aer.nombre_aerolinea,
      aer.codigo_aerolinea,
      v.estado            AS estado_vuelo
    FROM compra c
    JOIN factura f ON f.id_compra = c.id_compra
    JOIN reserva r ON r.id_reserva = c.id_reserva
    JOIN usuario u ON u.id_usuario = r.id_usuario
    JOIN vuelo v ON v.id_vuelo = r.id_vuelo
    JOIN ciudad ori ON ori.id_ciudad = v.id_ciudad_origen
    JOIN ciudad dest ON dest.id_ciudad = v.id_ciudad_destino
    JOIN aerolinea aer ON aer.id_aerolinea = v.id_aerolinea
    WHERE c.id_compra = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(queryInfo, [id_compra]);
  if (rows.length === 0) {
    throw new Error("No se encontró info de la compra para enviar correo");
  }
  const info = rows[0];

  const facturaPDF = await generarPDFFactura(info);

  const htmlCorreo = `
    <html>
      <body style="font-family:Arial, sans-serif; background:#f4f4f9; color:#333; padding:20px;">
        <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); padding:24px;">
          <div style="text-align:center; border-bottom:1px solid #e5e7eb; padding-bottom:16px; margin-bottom:16px;">
            <h2 style="margin:0; color:#0066ff;">AereoSky</h2>
            <p style="margin:4px 0 0 0; font-size:14px; color:#555;">
              ¡Gracias por tu compra ${info.p_nombre || ""}!
            </p>
          </div>

          <p style="font-size:15px; line-height:1.5; color:#444;">
            Tu compra ha sido confirmada. Te adjuntamos tu <strong>Factura</strong> en PDF.
          </p>

          <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:12px 16px; font-size:14px; line-height:1.4; margin-top:16px;">
            <div><strong>Ruta:</strong> ${info.origen_ciudad} (${info.origen_codigo}) → ${info.destino_ciudad} (${info.destino_codigo})</div>
            <div><strong>Aerolínea:</strong> ${info.nombre_aerolinea} (${info.codigo_aerolinea})</div>
            <div><strong>Salida:</strong> ${info.fecha_salida}</div>
            <div><strong>Llegada:</strong> ${info.fecha_llegada}</div>
          </div>

          <p style="font-size:13px; color:#666; margin-top:20px;">
            Tu billete físico estará disponible para recoger en el aeropuerto.<br/>
            Lleva tu documento de identidad y el número de compra <strong>${info.id_compra}</strong>.
          </p>

          <p style="font-size:12px; color:#999; text-align:center; margin-top:32px;">
            Este es un mensaje automático. Por favor no respondas directamente.
            <br/>AereoSky © 2025
          </p>
        </div>
      </body>
    </html>
  `;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: info.correo,
    subject: "Tu factura de compra - AereoSky",
    html: htmlCorreo,
    attachments: [
      {
        filename: facturaPDF.filename,
        content: facturaPDF.buffer,
        contentType: "application/pdf",
      },
    ],
  });

  return {
    correoEnviadoA: info.correo,
    id_compra: info.id_compra,
    id_factura: info.id_factura,
    billeteAdjuntado: false,
  };
}

// ========== ENDPOINTS ==========

// GET /tarjetas/:id_usuario
async function getTarjetasUsuario(req, res) {
  try {
    const { id_usuario } = req.params;
    const { rows } = await pool.query(
      `
      SELECT id_tarjeta, numero, fecha_vencimiento, tipo_tarjeta
      FROM tarjeta_credito
      WHERE id_usuario = $1
      ORDER BY id_tarjeta DESC
    `,
      [id_usuario]
    );

    const data = rows.map((t) => ({
      id_tarjeta: t.id_tarjeta,
      numero_mask: maskCard(t.numero),
      fecha_vencimiento: t.fecha_vencimiento,
      tipo_tarjeta: t.tipo_tarjeta,
    }));

    return res.status(200).json(data);
  } catch (e) {
    console.error("getTarjetasUsuario:", e.message);
    return res
      .status(500)
      .json({ message: "Error interno del servidor (tarjetas)" });
  }
}

// POST /tarjetas
async function createTarjetaUsuario(req, res) {
  try {
    const {
      id_usuario,
      numero,
      fecha_vencimiento,
      codigo_seguridad,
      tipo_tarjeta,
    } = req.body;

    if (!id_usuario || !numero || !fecha_vencimiento || !codigo_seguridad) {
      return res.status(400).json({ message: "Faltan datos de tarjeta." });
    }

    const onlyDigits = String(numero).replace(/\D/g, "");
    if (!onlyDigits) {
      return res.status(400).json({ message: "Número de tarjeta inválido." });
    }

    const brand = tipo_tarjeta || detectCardBrand(onlyDigits);

    const insert = `
      INSERT INTO tarjeta_credito
        (numero, id_usuario, fecha_vencimiento, codigo_seguridad, tipo_tarjeta)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_tarjeta, numero, tipo_tarjeta
    `;

    const { rows } = await pool.query(insert, [
      onlyDigits,
      id_usuario,
      fecha_vencimiento,
      codigo_seguridad,
      brand,
    ]);

    return res.status(201).json({
      id_tarjeta: rows[0].id_tarjeta,
      numero_mask: maskCard(rows[0].numero),
      tipo_tarjeta: rows[0].tipo_tarjeta,
      message: "Tarjeta guardada.",
    });
  } catch (e) {
    console.error("createTarjetaUsuario:", e.message);
    return res
      .status(500)
      .json({ message: "Error interno del servidor (crear tarjeta)" });
  }
}

// GET /checkout/:id_reserva
async function getCheckoutInfo(req, res) {
  try {
    const { id_reserva } = req.params;

    const query = `
      SELECT 
        r.id_reserva,
        r.estado           AS estado_reserva,
        r.id_usuario,
        r.id_categoria,
        r.id_vuelo,

        v.fecha_salida,
        v.fecha_llegada,
        v.precio           AS precio_base_vuelo,
        v.asientos_disponibles,
        v.tipo_vuelo,
        v.estado           AS estado_vuelo,

        ori.nombre            AS origen_ciudad,
        ori.codigo_iata       AS origen_iata,
        dest.nombre           AS destino_ciudad,
        dest.codigo_iata      AS destino_iata,

        a.nombre_aerolinea,
        a.codigo_aerolinea,

        c.categoria        AS nombre_categoria,
        c.rango_inicio,
        c.rango_fin,
        c.precio_categoria

      FROM reserva r
      JOIN vuelo v                ON v.id_vuelo = r.id_vuelo
      JOIN ciudad ori             ON ori.id_ciudad = v.id_ciudad_origen
      JOIN ciudad dest            ON dest.id_ciudad = v.id_ciudad_destino
      JOIN aerolinea a            ON a.id_aerolinea = v.id_aerolinea
      JOIN categoria_asiento c    ON c.id_categoria = r.id_categoria
      WHERE r.id_reserva = $1
    `;

    const result = await pool.query(query, [id_reserva]);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Reserva no encontrada para checkout." });
    }

    const row = result.rows[0];
    const precioBase = Number(row.precio_base_vuelo) || 0;
    const recargoCat = Number(row.precio_categoria) || 0;
    const subtotal = precioBase + recargoCat;
    const impuestos = +(subtotal * 0.12).toFixed(2);
    const totalConIva = +(subtotal + impuestos).toFixed(2);

    return res.status(200).json({
      id_reserva: row.id_reserva,
      estado_reserva: row.estado_reserva,
      vuelo: {
        origen: `${row.origen_ciudad} (${row.origen_iata})`,
        destino: `${row.destino_ciudad} (${row.destino_iata})`,
        aerolinea: row.nombre_aerolinea,
        codigo_aerolinea: row.codigo_aerolinea,
        fecha_salida: row.fecha_salida,
        fecha_llegada: row.fecha_llegada,
        tipo_vuelo: row.tipo_vuelo,
        estado_vuelo: row.estado_vuelo,
        asientos_disponibles: row.asientos_disponibles,
      },
      categoria: {
        nombre_categoria: row.nombre_categoria,
        rango_inicio: row.rango_inicio,
        rango_fin: row.rango_fin,
        precio_categoria: row.precio_categoria,
      },
      precios: {
        precio_base_vuelo: precioBase,
        recargo_categoria: recargoCat,
        monto_total: subtotal,
        impuestos: impuestos,
        total_con_impuestos: totalConIva,
      },
    });
  } catch (e) {
    console.error("getCheckoutInfo:", e.message);
    return res
      .status(500)
      .json({ message: "Error interno del servidor (checkout)" });
  }
}

// POST /compras
async function createCompra(req, res) {
  const client = await pool.connect();

  try {
    const { id_reserva, metodo_entrega_billete, tarjeta } = req.body;

    if (!id_reserva || !metodo_entrega_billete || !tarjeta) {
      client.release();
      return res.status(400).json({ message: "Faltan datos para la compra." });
    }

    await client.query("BEGIN");

    // 1) Reserva pendiente
    const qReserva = `
      SELECT r.id_reserva,
             r.id_usuario,
             r.id_categoria,
             r.id_vuelo,
             r.estado          AS estado_reserva,
             v.precio          AS precio_base,
             c.precio_categoria
      FROM reserva r
      JOIN vuelo v              ON v.id_vuelo = r.id_vuelo
      JOIN categoria_asiento c  ON c.id_categoria = r.id_categoria
      WHERE r.id_reserva = $1
        AND r.estado = 'Pendiente'
      FOR UPDATE
    `;
    const resReserva = await client.query(qReserva, [id_reserva]);

    if (resReserva.rows.length === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res
        .status(404)
        .json({ message: "Reserva no válida o ya procesada." });
    }

    const { id_usuario, id_vuelo, precio_base, precio_categoria } =
      resReserva.rows[0];

    const monto_total = Number(precio_base) + Number(precio_categoria || 0);
    const impuestos = +(monto_total * 0.12).toFixed(2);

    // 2) Tarjeta
    let id_tarjeta_final = null;

    if (tarjeta.usarExistente) {
      if (!tarjeta.id_tarjeta) {
        await client.query("ROLLBACK");
        client.release();
        return res
          .status(400)
          .json({ message: "Falta id_tarjeta en tarjeta existente." });
      }

      const chk = await client.query(
        `
          SELECT id_tarjeta
          FROM tarjeta_credito
          WHERE id_tarjeta = $1
            AND id_usuario = $2
        `,
        [tarjeta.id_tarjeta, id_usuario]
      );

      if (chk.rows.length === 0) {
        await client.query("ROLLBACK");
        client.release();
        return res
          .status(403)
          .json({ message: "Tarjeta no válida para este usuario." });
      }

      id_tarjeta_final = tarjeta.id_tarjeta;
    } else {
      const cleanDigits = String(tarjeta.numero || "").replace(/\D/g, "");
      if (!cleanDigits) {
        await client.query("ROLLBACK");
        client.release();
        return res.status(400).json({ message: "Número de tarjeta inválido." });
      }

      const brand = tarjeta.tipo_tarjeta || detectCardBrand(cleanDigits);

      const insTarjeta = `
        INSERT INTO tarjeta_credito
          (numero, id_usuario, fecha_vencimiento, codigo_seguridad, tipo_tarjeta)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_tarjeta
      `;

      const rT = await client.query(insTarjeta, [
        cleanDigits,
        id_usuario,
        tarjeta.fecha_vencimiento,
        tarjeta.codigo_seguridad,
        brand,
      ]);

      id_tarjeta_final = rT.rows[0].id_tarjeta;
    }

    // 3) compra
    const insCompra = `
      INSERT INTO compra
        (id_reserva, fecha_compra, metodo_entrega_billete, monto_total)
      VALUES ($1, NOW()::date, $2, $3)
      RETURNING id_compra
    `;
    const rCompra = await client.query(insCompra, [
      id_reserva,
      metodo_entrega_billete,
      monto_total,
    ]);
    const id_compra = rCompra.rows[0].id_compra;

    // 4) factura
    const insFactura = `
      INSERT INTO factura
        (id_usuario, id_compra, id_tarjeta, id_billete, fecha_emision, monto_total, impuestos)
      VALUES ($1, $2, $3, NULL, NOW()::date, $4, $5)
      RETURNING id_factura
    `;
    const rFactura = await client.query(insFactura, [
      id_usuario,
      id_compra,
      id_tarjeta_final,
      monto_total,
      impuestos,
    ]);
    const id_factura = rFactura.rows[0].id_factura;

    // 5) billete
    const asientoAsignado = "A" + Math.floor(Math.random() * 30 + 1);

    const insBillete = `
      INSERT INTO billete
        (id_factura, id_compra, id_usuario, numero_asiento)
      VALUES ($1, $2, $3, $4)
      RETURNING id_billete, numero_asiento
    `;
    const rBillete = await client.query(insBillete, [
      id_factura,
      id_compra,
      id_usuario,
      asientoAsignado,
    ]);
    const id_billete = rBillete.rows[0].id_billete;
    const numero_asiento = rBillete.rows[0].numero_asiento;

    // 6) link billete -> factura
    await client.query(
      `UPDATE factura SET id_billete = $1 WHERE id_factura = $2`,
      [id_billete, id_factura]
    );

    // 7) confirmar reserva
    await client.query(
      `UPDATE reserva SET estado = 'Confirmada' WHERE id_reserva = $1`,
      [id_reserva]
    );

    await client.query("COMMIT");
    client.release();

    // 8) envío de correo (fuera de la transacción)
    let correoInfo = null;
    try {
      if (metodo_entrega_billete === "Retiro en aeropuerto") {
        const envio = await enviarCorreoFacturaInternal(id_compra);
        correoInfo = {
          correoEnviadoA: envio.correoEnviadoA,
          facturaEnviada: true,
          billeteEnviado: false,
        };
      } else {
        const envio = await enviarCorreoCompraInternal(id_compra);
        correoInfo = {
          correoEnviadoA: envio.correoEnviadoA,
          facturaEnviada: true,
          billeteEnviado: true,
        };
      }
    } catch (errCorreo) {
      console.error("Error enviando correo post-compra:", errCorreo.message);
    }

    // 9) respuesta al frontend
    return res.status(201).json({
      message: "Compra realizada correctamente",
      compra: {
        id_compra,
        monto_total,
        metodo_entrega_billete,
      },
      factura: {
        id_factura,
        impuestos,
      },
      billete: {
        id_billete,
        numero_asiento,
      },
      correo: correoInfo,
    });
  } catch (e) {
    await client.query("ROLLBACK");
    client.release();
    console.error("createCompra:", e.message);
    return res.status(500).json({ message: "Error procesando la compra" });
  }
}

// POST /correo-compra/:id_compra  (reenviar manualmente)
async function reenviarCorreoCompra(req, res) {
  const { id_compra } = req.params;
  try {
    const correoInfo = await enviarCorreoCompraInternal(id_compra);
    return res.status(200).json({
      message: "Correo reenviado correctamente",
      ...correoInfo,
    });
  } catch (err) {
    console.error("reenviarCorreoCompra:", err.message);
    return res.status(500).json({
      message: "Error al reenviar el correo de compra",
      detalle: err.message,
    });
  }
}

async function getCompraByReserva(req, res) {
  const { id_reserva } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT c.id_compra
      FROM compra c
      WHERE c.id_reserva = $1
      LIMIT 1;
      `,
      [id_reserva]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No existe una compra asociada a esta reserva",
      });
    }

    return res.status(200).json({
      id_compra: result.rows[0].id_compra,
    });
  } catch (err) {
    console.error("getCompraByReserva:", err.message);
    return res.status(500).json({
      message: "Error al obtener la compra asociada",
      detalle: err.message,
    });
  }
}

// EXPORTS
module.exports = {
  getTarjetasUsuario,
  createTarjetaUsuario,
  getCheckoutInfo,
  createCompra,
  reenviarCorreoCompra,
  getCompraByReserva
};
