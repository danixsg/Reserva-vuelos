const pool = require("../db/pool");

async function insertarAvion(req, res) {
  try {
    const {
      id_aerolinea,
      id_fabricante,
      matricula,
      modelo,
      capacidad_asientos,
      anio_fabricacion,
    } = req.body;

    // Validación simple
    if (!matricula || !modelo || !capacidad_asientos || !anio_fabricacion) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    const query = `
      SELECT * FROM insertarAvion($1, $2, $3, $4, $5, $6)
    `;
    const values = [
      id_aerolinea,
      id_fabricante,
      matricula,
      modelo,
      capacidad_asientos,
      anio_fabricacion,
    ];

    const { rows } = await pool.query(query, values);
    const result = rows[0];

    if (!result.id_avion_result) {
      return res.status(400).json({ message: result.mensaje });
    }

    return res.status(201).json({
      id_avion: result.id_avion_result,
      message: result.mensaje,
    });
  } catch (error) {
    console.error("Error en insertarAvion:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor",
      detalle: error.message,
    });
  }
}

async function getAviones(req, res) {
  try {
    const query = "SELECT * FROM getAviones()";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No hay aviones registrados" });
    }

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error en getAviones:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor",
      detalle: error.message,
    });
  }
}

async function getAvion(req, res) {
  try {
    const { id } = req.params;

    if (!Number(id)) {
      return res.status(400).json({ message: "El ID debe ser numérico" });
    }

    // Consulta directa: incluye aerolínea y fabricante
    const query = `
      SELECT 
        a.id_avion,
        a.matricula,
        a.modelo,
        a.capacidad_asientos,
        a.anio_fabricacion,
        a.estado,
        ae.id_aerolinea,
        ae.nombre_aerolinea,
        ae.codigo_aerolinea,
        f.id_fabricante,
        f.nombre_fabricante,
        f.pais
      FROM avion a
      LEFT JOIN aerolinea ae ON a.id_aerolinea = ae.id_aerolinea
      LEFT JOIN fabricante_avion f ON a.id_fabricante = f.id_fabricante
      WHERE a.id_avion = $1
      AND estado = 'Activo'
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Avión no encontrado" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error en getAvion:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor",
      detalle: error.message,
    });
  }
}

async function updateAvion(req, res) {
  try {
    const { id } = req.params;
    const {
      id_aerolinea,
      id_fabricante,
      matricula,
      modelo,
      capacidad_asientos,
      anio_fabricacion,
      estado,
    } = req.body;

    if (!Number(id)) {
      return res.status(400).json({ message: "El ID debe ser numérico" });
    }

    const query = `
      SELECT * FROM updateAvion($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    const values = [
      id,
      id_aerolinea,
      id_fabricante,
      matricula,
      modelo,
      capacidad_asientos,
      anio_fabricacion,
      estado,
    ];

    const { rows } = await pool.query(query, values);
    const result = rows[0];

    if (!result.id_avion_result) {
      return res.status(400).json({ message: result.mensaje });
    }

    return res.status(200).json({
      id_avion: result.id_avion_result,
      message: result.mensaje,
    });
  } catch (error) {
    console.error("Error en updateAvion:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor",
      detalle: error.message,
    });
  }
}

async function deleteAvion(req, res) {
  try {
    const { id } = req.params;

    if (!Number(id)) {
      return res.status(400).json({ message: "El ID debe ser numérico" });
    }

    const query = "SELECT * FROM deleteAvion($1)";
    const values = [id];

    const { rows } = await pool.query(query, values);
    const result = rows[0];

    if (!result.id_avion_result) {
      return res.status(404).json({ message: result.mensaje });
    }

    return res.status(200).json({
      id_avion: result.id_avion_result,
      message: result.mensaje,
    });
  } catch (error) {
    console.error("Error en deleteAvion:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor",
      detalle: error.message,
    });
  }
}

module.exports = {
  insertarAvion,
  getAviones,
  getAvion,
  updateAvion,
  deleteAvion,
};
