const pool = require("../db/pool");

async function getTarjetasPorUsuario(req, res) {
  try {
    const { id_usuario } = req.params;
    const { rows } = await pool.query(
      `SELECT 
         id_tarjeta, 
         id_usuario, 
         CONCAT('************', RIGHT(numero, 4)) AS numero_enmascarado, -- Enmascarar número
         fecha_vencimiento, 
         tipo_tarjeta 
       FROM tarjeta_credito 
       WHERE id_usuario = $1`,
      [id_usuario]
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error en getTarjetasPorUsuario:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

// Crear una nueva tarjeta
async function createTarjeta(req, res) {
  try {
    const { id_usuario, numero, fecha_vencimiento, codigo_seguridad, tipo_tarjeta } = req.body;

    if (!id_usuario || !numero || !fecha_vencimiento || !codigo_seguridad || !tipo_tarjeta) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    const { rows } = await pool.query(
      `INSERT INTO tarjetas_credito (id_usuario, numero, fecha_vencimiento, codigo_seguridad, tipo_tarjeta) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id_tarjeta, tipo_tarjeta`,
      [id_usuario, numero, fecha_vencimiento, codigo_seguridad, tipo_tarjeta]
    );

    return res.status(201).json({ message: "Tarjeta agregada exitosamente", tarjeta: rows[0] });
  } catch (error) {
    console.error("Error en createTarjeta:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

// Eliminar una tarjeta
async function deleteTarjeta(req, res) {
  try {
    const { id_tarjeta } = req.params;
    const { rowCount } = await pool.query(
      `DELETE FROM tarjeta_credito WHERE id_tarjeta = $1`,
      [id_tarjeta]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Tarjeta no encontrada" });
    }

    return res.status(200).json({ message: "Tarjeta eliminada correctamente" });
  } catch (error) {
    console.error("Error en deleteTarjeta:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

module.exports = {
  getTarjetasPorUsuario,
  createTarjeta,
  deleteTarjeta,
};