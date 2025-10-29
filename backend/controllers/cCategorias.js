const pool = require("../db/pool");

// GET /categorias-asiento
async function getCategoriasAsiento(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        id_categoria,
        categoria,
        rango_inicio,
        rango_fin,
        precio_categoria
      FROM categoria_asiento
      ORDER BY id_categoria ASC
    `);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error en getCategoriasAsiento:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

module.exports = {
  getCategoriasAsiento,
};
