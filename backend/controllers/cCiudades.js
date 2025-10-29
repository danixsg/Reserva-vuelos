const pool = require("../db/pool");

async function getCiudades(req, res) {
  try {
    const q = `
      SELECT 
        c.id_ciudad,
        c.nombre       AS ciudad,
        c.codigo_iata  AS iata,
        p.nombre       AS pais
      FROM ciudad c
      LEFT JOIN pais p ON p.id_pais = c.id_pais
      ORDER BY p.nombre ASC, c.nombre ASC;
    `;
    const { rows } = await pool.query(q);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No hay ciudades registradas' });
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error('getCiudades:', err.message);
    return res.status(500).json({
      message: 'Error interno del servidor',
      detalle: err.message,
    });
  }
}

module.exports = {
  getCiudades,
};