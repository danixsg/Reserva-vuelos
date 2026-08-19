const pool = require("../db/pool");

async function getFabricantes(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT id_fabricante,
             nombre_fabricante,
             pais,
             telefono,
             correo,
             direccion,
             estado
      FROM fabricante_avion
      WHERE estado = 'Activo'
      ORDER BY id_fabricante ASC
    `);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error en getFabricantes:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getFabricante(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      SELECT id_fabricante,
             nombre_fabricante,
             pais,
             telefono,
             correo,
             direccion,
             estado
      FROM fabricante_avion
      WHERE id_fabricante = $1
        AND estado = 'Activo'
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Fabricante no encontrado o inactivo" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error en getFabricante:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function createFabricante(req, res) {
  try {
    const { nombre_fabricante, pais, telefono, correo, direccion } = req.body;

    if (!nombre_fabricante || !pais) {
      return res
        .status(400)
        .json({ message: "Faltan campos obligatorios (nombre y país)." });
    }

    const query = `
      INSERT INTO fabricante_avion
        (nombre_fabricante, pais, telefono, correo, direccion, estado)
      VALUES ($1, $2, $3, $4, $5, 'Activo')
      RETURNING *
    `;

    const values = [
      nombre_fabricante,
      pais,
      telefono || null,
      correo || null,
      direccion || null,
    ];

    const { rows } = await pool.query(query, values);

    return res.status(201).json({
      message: "Fabricante creado exitosamente",
      fabricante: rows[0],
    });
  } catch (error) {
    console.error("Error en createFabricante:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function updateFabricante(req, res) {
  try {
    const { id } = req.params;
    const { nombre_fabricante, pais, telefono, correo, direccion } = req.body;

    const query = `
      UPDATE fabricante_avion
      SET nombre_fabricante = $1,
          pais = $2,
          telefono = $3,
          correo = $4,
          direccion = $5
      WHERE id_fabricante = $6
        AND estado = 'Activo'
      RETURNING *
    `;

    const values = [nombre_fabricante, pais, telefono, correo, direccion, id];
    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Fabricante no encontrado o inactivo" });
    }

    return res.status(200).json({
      message: "Fabricante actualizado correctamente",
      fabricante: rows[0],
    });
  } catch (error) {
    console.error("Error en updateFabricante:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function deleteFabricante(req, res) {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `UPDATE fabricante_avion
       SET estado = 'Inactivo'
       WHERE id_fabricante = $1
         AND estado = 'Activo'`,
      [id]
    );

    if (rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Fabricante no encontrado o ya inactivo" });
    }

    return res
      .status(200)
      .json({ message: "Fabricante marcado como Inactivo correctamente" });
  } catch (error) {
    console.error("Error en deleteFabricante:", error.message);
    return res
      .status(500)
      .json({ message: "Error interno del servidor" });
  }
}

module.exports = {
  getFabricantes,
  getFabricante,
  createFabricante,
  updateFabricante,
  deleteFabricante,
};
