const pool = require("../db/pool");

async function getAerolineas(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT id_aerolinea,
             nombre_aerolinea,
             codigo_aerolinea,
             telefono_aerolinea,
             correo_aerolinea,
             direccion_aerolinea,
             estado
      FROM aerolinea
      WHERE estado = 'Activo'
      ORDER BY id_aerolinea ASC
    `);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error en getAerolineas:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getAerolinea(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      SELECT id_aerolinea,
             nombre_aerolinea,
             codigo_aerolinea,
             telefono_aerolinea,
             correo_aerolinea,
             direccion_aerolinea,
             estado
      FROM aerolinea
      WHERE id_aerolinea = $1
        AND estado = 'Activo'
      `,
      [id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Aerolínea no encontrada o inactiva" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error en getAerolinea:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function createAerolinea(req, res) {
  try {
    const {
      nombre_aerolinea,
      codigo_aerolinea,
      telefono_aerolinea,
      correo_aerolinea,
      direccion_aerolinea,
    } = req.body;

    if (!nombre_aerolinea || !codigo_aerolinea) {
      return res.status(400).json({ message: "Faltan campos obligatorios." });
    }

    const query = `
      INSERT INTO aerolinea (
        nombre_aerolinea,
        codigo_aerolinea,
        telefono_aerolinea,
        correo_aerolinea,
        direccion_aerolinea,
        estado
      )
      VALUES ($1, $2, $3, $4, $5, 'Activo')
      RETURNING *
    `;

    const values = [
      nombre_aerolinea,
      codigo_aerolinea,
      telefono_aerolinea || null,
      correo_aerolinea || null,
      direccion_aerolinea || null,
    ];

    const { rows } = await pool.query(query, values);

    return res.status(201).json({
      message: "Aerolínea creada exitosamente",
      aerolinea: rows[0],
    });
  } catch (error) {
    console.error("Error en createAerolinea:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function updateAerolinea(req, res) {
  try {
    const { id } = req.params;
    const {
      nombre_aerolinea,
      codigo_aerolinea,
      telefono_aerolinea,
      correo_aerolinea,
      direccion_aerolinea,
    } = req.body;

    const query = `
      UPDATE aerolinea
      SET nombre_aerolinea     = $1,
          codigo_aerolinea     = $2,
          telefono_aerolinea   = $3,
          correo_aerolinea     = $4,
          direccion_aerolinea  = $5
      WHERE id_aerolinea = $6
        AND estado = 'Activo'
      RETURNING *
    `;

    const values = [
      nombre_aerolinea,
      codigo_aerolinea,
      telefono_aerolinea,
      correo_aerolinea,
      direccion_aerolinea,
      id,
    ];

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Aerolínea no encontrada o inactiva" });
    }

    return res.status(200).json({
      message: "Aerolínea actualizada correctamente",
      aerolinea: rows[0],
    });
  } catch (error) {
    console.error("Error en updateAerolinea:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function deleteAerolinea(req, res) {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `
      UPDATE aerolinea
      SET estado = 'Inactivo'
      WHERE id_aerolinea = $1
        AND estado = 'Activo'
      `,
      [id]
    );

    if (rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Aerolínea no encontrada o ya inactiva" });
    }

    return res
      .status(200)
      .json({ message: "Aerolínea marcada como Inactiva correctamente" });
  } catch (error) {
    console.error("Error en deleteAerolinea:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

module.exports = {
  getAerolineas,
  getAerolinea,
  createAerolinea,
  updateAerolinea,
  deleteAerolinea,
};
