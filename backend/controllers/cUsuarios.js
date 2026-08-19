const pool = require("../db/pool");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

async function register(req, res) {
  try {
    const {
      cedula,
      p_nombre,
      s_nombre,
      p_apellido,
      s_apellido,
      correo,
      contraseña,
      telefono,
      direccion,
    } = req.body;

    // Validar campos mínimos
    if (!correo || !contraseña) {
      return res
        .status(400)
        .json({ message: "Correo y contraseña son obligatorios" });
    }

    // Encriptar la contraseña antes de guardarla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contraseña, salt);

    // Ejecutar la función SQL con la contraseña encriptada
    const query = `
      SELECT * FROM register(
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
    `;
    const values = [
      cedula,
      p_nombre,
      s_nombre,
      p_apellido,
      s_apellido,
      correo,
      hashedPassword, // ✅ contraseña encriptada
      telefono,
      direccion,
    ];

    const { rows } = await pool.query(query, values);
    const result = rows[0];

    // Verificar mensaje de la función
    if (!result.id_usuario) {
      return res.status(400).json({ message: result.mensaje });
    }

    // Éxito
    return res.status(201).json({
      id_usuario: result.id_usuario,
      message: result.mensaje,
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor",
      detalle: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const { correo, contraseña } = req.body;

    if (!correo || !contraseña) {
      return res
        .status(400)
        .json({ message: "Correo y contraseña son obligatorios" });
    }

    // Llamar a la función SQL de forma segura (parámetro preparado)
    const { rows } = await pool.query("SELECT * FROM login($1)", [correo]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const usuario = rows[0];

    // Verificar contraseña encriptada con bcrypt
    const validPassword = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    if (usuario.estado !== "Activo") {
      return res.status(403).json({ message: "Usuario inactivo o bloqueado" });
    }

    return res.status(200).json({
      id_usuario: usuario.id_usuario,
      correo: usuario.correo,
      estado: usuario.estado,
      rol: usuario.rol,
      message: "Login exitoso",
    });
  } catch (error) {
    console.error("Error en loginUsuario:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor",
      detalle: error.message,
    });
  }
}

async function getUsuario(req, res) {
  try {
    const { id } = req.params;

    // Validar que el parámetro sea numérico
    if (!Number(id)) {
      return res.status(400).json({ message: "El ID debe ser numérico" });
    }

    // Llamar a la función SQL de forma segura
    const { rows } = await pool.query("SELECT * FROM getUsuario($1)", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error en getUsuario:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor",
      detalle: error.message,
    });
  }
}

async function updateUsuario(req, res) {
  try {
    const { id } = req.params;
    const {
      cedula,
      p_nombre,
      s_nombre,
      p_apellido,
      s_apellido,
      correo,
      telefono,
      direccion,
    } = req.body;

    // Validar ID
    if (!Number(id)) {
      return res.status(400).json({ message: "El ID debe ser numérico" });
    }

    // Llamar a la función SQL con parámetros seguros
    const query = `
      SELECT * FROM updateUsuario(
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
    `;

    const values = [
      id,
      cedula,
      p_nombre,
      s_nombre,
      p_apellido,
      s_apellido,
      correo,
      telefono,
      direccion,
    ];

    const { rows } = await pool.query(query, values);
    const result = rows[0];

    if (!result.id_usuario) {
      return res.status(404).json({ message: result.mensaje });
    }

    return res.status(200).json({
      id_usuario: result.id_usuario,
      message: result.mensaje,
    });
  } catch (error) {
    console.error("Error en updateUsuario:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor",
      detalle: error.message,
    });
  }
}

// PUT /usuarios/:id
// Actualiza datos editables del usuario (NO contraseña, NO fecha_registro)
async function updateUsuarioAdmin(req, res) {
  try {
    const { id } = req.params;
    const {
      cedula,
      p_nombre,
      s_nombre,
      p_apellido,
      s_apellido,
      correo,
      telefono,
      direccion,
    } = req.body;

    if (!Number(id)) {
      return res.status(400).json({ message: "El ID debe ser numérico." });
    }

    // Actualizamos SOLO datos personales/contacto.
    // NO tocamos: estado, contraseña, fecha_registro.
    const result = await pool.query(
      `UPDATE usuario
       SET cedula = $1,
           p_nombre = $2,
           s_nombre = $3,
           p_apellido = $4,
           s_apellido = $5,
           correo = $6,
           telefono = $7,
           direccion = $8
       WHERE id_usuario = $9
       RETURNING id_usuario`,
      [
        cedula || null,
        p_nombre || null,
        s_nombre || null,
        p_apellido || null,
        s_apellido || null,
        correo || null,
        telefono || null,
        direccion || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    return res
      .status(200)
      .json({ message: "Usuario actualizado correctamente." });
  } catch (error) {
    console.error("Error en updateUsuario:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
}

async function deleteUsuario(req, res) {
  try {
    const { id } = req.params;

    if (!Number(id)) {
      return res.status(400).json({ message: "El ID debe ser numérico" });
    }

    // Llamar a la función SQL
    const query = "SELECT * FROM deleteUsuario($1)";
    const values = [id];

    const { rows } = await pool.query(query, values);
    const result = rows[0];

    if (!result.id_usuario_result) {
      return res.status(404).json({ message: result.mensaje });
    }

    return res.status(200).json({
      id_usuario: result.id_usuario_result,
      message: result.mensaje,
    });
  } catch (error) {
    console.error("Error en deleteUsuario:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor",
      detalle: error.message,
    });
  }
}

// Restablecer (reactivar) usuario inactivo
async function restablecerUsuario(req, res) {
  try {
    const { id } = req.params;

    if (!Number(id)) {
      return res.status(400).json({ message: "El ID debe ser numérico" });
    }

    // Llamar a la función SQL
    const query = "SELECT * FROM restablecerUsuario($1)";
    const values = [id];

    const { rows } = await pool.query(query, values);
    const result = rows[0];

    if (!result.id_usuario_result) {
      return res.status(404).json({ message: result.mensaje });
    }

    return res.status(200).json({
      id_usuario: result.id_usuario_result,
      message: result.mensaje,
    });
  } catch (error) {
    console.error("Error en restablecerUsuario:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor",
      detalle: error.message,
    });
  }
}

async function updatePassword(req, res) {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Se requiere la contraseña actual y la nueva." });
    }

    const userResult = await pool.query(
      "SELECT contraseña FROM usuario WHERE id_usuario = $1",
      [id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    const hashedPassword = userResult.rows[0].contraseña;

    const isMatch = await bcrypt.compare(currentPassword, hashedPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "La contraseña actual es incorrecta." });
    }

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      "UPDATE usuario SET contraseña = $1 WHERE id_usuario = $2",
      [newHashedPassword, id]
    );

    return res
      .status(200)
      .json({ message: "Contraseña actualizada exitosamente." });
  } catch (error) {
    console.error("Error en updatePassword:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}

async function updatePasswordRec(req, res) {
  try {
    const { id } = req.params;
    const { nueva_contraseña } = req.body;

    if (!nueva_contraseña) {
      return res
        .status(400)
        .json({ message: "La nueva contraseña es requerida." });
    }

    // Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nueva_contraseña, salt);

    // Actualizar la contraseña en la base de datos
    const result = await pool.query(
      "UPDATE usuario SET contraseña = $1 WHERE id_usuario = $2 RETURNING id_usuario",
      [hashedPassword, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    return res
      .status(200)
      .json({ message: "Contraseña actualizada exitosamente." });
  } catch (error) {
    console.error("Error en updatePassword:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}

async function enviarCorreoRecuperacion(req, res) {
  const { correo } = req.body;

  try {
    // Verificar si el correo existe en la base de datos
    const { rows } = await pool.query(
      "SELECT id_usuario, p_nombre, correo FROM usuario WHERE correo = $1",
      [correo]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No existe una cuenta con ese correo" });
    }

    const usuario = rows[0];

    // Codificar el ID de usuario en base64 para no exponerlo directamente
    const tokenId = Buffer.from(String(usuario.id_usuario)).toString("base64");

    // Enlace al frontend (puedes cambiar por tu dominio o ruta real)
    const enlaceRecuperacion = `http://localhost:5173/src/views/recuperar-cuenta?id=${encodeURIComponent(
      tokenId
    )}`;

    // Configurar el transporte
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Contenido del correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: usuario.correo,
      subject: "Recuperación de contraseña - AereoSky",
      html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f9;
              margin: 0;
              padding: 0;
            }
            .container {
              width: 100%;
              max-width: 600px;
              margin: 30px auto;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              padding: 20px;
            }
            .header {
              text-align: center;
              background-color: #007bff;
              color: #ffffff;
              padding: 20px 0;
              border-radius: 8px 8px 0 0;
            }
            .header img {
              max-width: 80px;
              height: auto;
              margin-bottom: 10px;
            }
            .content {
              padding: 20px;
              text-align: center;
              font-size: 16px;
              color: #333333;
            }
            .button {
              display: inline-block;
              padding: 12px 25px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              font-size: 18px;
              border-radius: 5px;
              margin-top: 20px;
            }
            .button:hover {
              background-color: #0056b3;
            }
            .footer {
              text-align: center;
              font-size: 14px;
              color: #777777;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="http://www.w3.org/2000/svg" alt="AereoSky" />
              <h2>AereoSky</h2>
            </div>
            <div class="content">
              <p>Hola ${usuario.p_nombre || "usuario"},</p>
              <p>Hemos recibido una solicitud para restablecer tu contraseña en <strong>AereoSky</strong>.</p>
              <p>Puedes hacerlo haciendo clic en el siguiente botón:</p>
              <a href="${enlaceRecuperacion}" class="button">Recuperar contraseña</a>
              <p>Si tú no realizaste esta solicitud, puedes ignorar este mensaje.</p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático. Por favor, no respondas.</p>
            </div>
          </div>
        </body>
      </html>
      `,
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Correo de recuperación enviado correctamente",
      id_usuario: usuario.id_usuario,
    });
  } catch (error) {
    console.error("Error al enviar correo de recuperación:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor",
      detalle: error.message,
    });
  }
}

// GET /usuarios
// Lista todos los usuarios (sin contraseña)
async function getUsuarios(req, res) {
  try {
    const result = await pool.query(
      `SELECT 
        id_usuario,
        cedula,
        p_nombre,
        s_nombre,
        p_apellido,
        s_apellido,
        correo,
        telefono,
        direccion,
        fecha_registro,
        estado
      FROM usuario
      ORDER BY id_usuario ASC`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error en getUsuarios:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}

// GET /usuarios/:id
// Trae 1 usuario (sin contraseña)
async function getUsuarioById(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        id_usuario,
        cedula,
        p_nombre,
        s_nombre,
        p_apellido,
        s_apellido,
        correo,
        telefono,
        direccion,
        fecha_registro,
        estado
      FROM usuario
      WHERE id_usuario = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error en getUsuarioById:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}

// PUT /usuarios/:id/estado
// Cambia SOLO el estado (toggle rápido desde el botón Cambiar Estado)
async function updateUsuarioEstado(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body; // "Activo" o "Inactivo"

    if (!estado) {
      return res
        .status(400)
        .json({ message: "Se requiere el nuevo estado." });
    }

    if (estado !== "Activo" && estado !== "Inactivo") {
      return res
        .status(400)
        .json({ message: 'El estado debe ser "Activo" o "Inactivo".' });
    }

    const result = await pool.query(
      `UPDATE usuario
       SET estado = $1
       WHERE id_usuario = $2
       RETURNING id_usuario, estado`,
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    return res.status(200).json({
      message: `Estado actualizado a ${estado}.`,
      estado: result.rows[0].estado,
    });
  } catch (error) {
    console.error("Error en updateUsuarioEstado:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}

// DELETE /usuarios/:id
// "Eliminar" = baja lógica => marcar estado = 'Inactivo'
async function deleteUsuario(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE usuario
       SET estado = 'Inactivo'
       WHERE id_usuario = $1
       RETURNING id_usuario`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    return res
      .status(200)
      .json({ message: "Usuario desactivado (estado Inactivo)." });
  } catch (error) {
    console.error("Error en deleteUsuario:", error.message);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}



module.exports = {
  register,
  login,
  getUsuario,
  updateUsuario,
  updateUsuarioAdmin,
  deleteUsuario,
  restablecerUsuario,
  updatePassword,
  updatePasswordRec,
  enviarCorreoRecuperacion,
  getUsuarios,
  getUsuarioById,
  updateUsuarioEstado,
  deleteUsuario,
};
