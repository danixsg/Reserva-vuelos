const pool = require("../db/pool");

async function createVuelo(req, res) {
  try {
    const {
      id_aerolinea,
      id_avion,
      id_ciudad_origen,
      id_ciudad_destino,
      fecha_salida, // ISO: '2025-10-26 14:30'
      fecha_llegada, // ISO
      tipo_vuelo, // p.ej. 'Directo' | 'Conexión'
      asientos_disponibles,
      precio,
      estado, // p.ej. 'Programado' | 'En vuelo' | 'Aterrizado' | 'Cancelado'
    } = req.body;

    // Validaciones básicas
    if (
      !id_aerolinea ||
      !id_avion ||
      !id_ciudad_origen ||
      !id_ciudad_destino ||
      !fecha_salida ||
      !fecha_llegada ||
      !tipo_vuelo ||
      asientos_disponibles == null ||
      precio == null
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios." });
    }
    if (Number(id_ciudad_origen) === Number(id_ciudad_destino)) {
      return res
        .status(400)
        .json({ message: "Ciudad origen y destino no pueden ser iguales." });
    }
    if (new Date(fecha_llegada) <= new Date(fecha_salida)) {
      return res
        .status(400)
        .json({
          message: "La fecha de llegada debe ser mayor a la de salida.",
        });
    }
    if (asientos_disponibles < 0 || precio < 0) {
      return res
        .status(400)
        .json({ message: "Asientos y precio deben ser valores no negativos." });
    }

    const q = `
      INSERT INTO vuelo (
        id_aerolinea, id_avion, id_ciudad_origen, id_ciudad_destino,
        fecha_salida, fecha_llegada, tipo_vuelo, asientos_disponibles,
        precio, estado
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10,'Programado'))
      RETURNING *;
    `;
    const vals = [
      id_aerolinea,
      id_avion,
      id_ciudad_origen,
      id_ciudad_destino,
      fecha_salida,
      fecha_llegada,
      tipo_vuelo,
      asientos_disponibles,
      precio,
      estado,
    ];
    const { rows } = await pool.query(q, vals);
    return res.status(201).json({ message: "Vuelo creado", vuelo: rows[0] });
  } catch (err) {
    console.error("createVuelo:", err.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getVuelo(req, res) {
  try {
    const { id } = req.params;
    if (!Number(id)) return res.status(400).json({ message: "ID inválido" });

    const q = `
      SELECT
        v.id_vuelo, v.id_aerolinea, v.id_avion, v.id_ciudad_origen, v.id_ciudad_destino,
        v.fecha_salida, v.fecha_llegada, v.tipo_vuelo, v.asientos_disponibles, v.precio, v.estado,
        ae.nombre_aerolinea, ae.codigo_aerolinea,
        a.matricula AS avion_matricula, a.modelo AS avion_modelo,
        co.nombre AS ciudad_origen, co.codigo_iata AS iata_origen,
        cd.nombre AS ciudad_destino, cd.codigo_iata AS iata_destino,
        EXTRACT(EPOCH FROM (v.fecha_llegada - v.fecha_salida))/60 AS duracion_minutos
      FROM vuelo v
      LEFT JOIN aerolinea ae ON ae.id_aerolinea = v.id_aerolinea
      LEFT JOIN avion a       ON a.id_avion = v.id_avion
      LEFT JOIN ciudad co     ON co.id_ciudad = v.id_ciudad_origen
      LEFT JOIN ciudad cd     ON cd.id_ciudad = v.id_ciudad_destino
      WHERE v.id_vuelo = $1;
    `;
    const { rows } = await pool.query(q, [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Vuelo no encontrado" });
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error("getVuelo:", err.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getVuelos(req, res) {
  try {
    const { id_origen, id_destino, fecha, id_aerolinea, estado, orden } =
      req.query;

    let where = [];
    let params = [];
    let i = 1;

    if (id_origen) {
      where.push(`v.id_ciudad_origen = $${i++}`);
      params.push(id_origen);
    }
    if (id_destino) {
      where.push(`v.id_ciudad_destino = $${i++}`);
      params.push(id_destino);
    }
    if (id_aerolinea) {
      where.push(`v.id_aerolinea = $${i++}`);
      params.push(id_aerolinea);
    }
    if (estado) {
      where.push(`v.estado = $${i++}`);
      params.push(estado);
    }
    if (fecha) {
      where.push(`DATE(v.fecha_salida) = $${i++}`);
      params.push(fecha);
    }

    const order =
      orden === "tarifas"
        ? "ORDER BY v.precio ASC"
        : orden === "horarios"
        ? "ORDER BY v.fecha_salida ASC"
        : "ORDER BY v.id_vuelo DESC";

    const q = `
      SELECT
        v.id_vuelo, v.fecha_salida, v.fecha_llegada, v.tipo_vuelo,
        v.asientos_disponibles, v.precio, v.estado,
        ae.nombre_aerolinea, ae.codigo_aerolinea,
        co.nombre AS ciudad_origen, co.codigo_iata AS iata_origen,
        cd.nombre AS ciudad_destino, cd.codigo_iata AS iata_destino
      FROM vuelo v
      LEFT JOIN aerolinea ae ON ae.id_aerolinea = v.id_aerolinea
      LEFT JOIN ciudad co     ON co.id_ciudad = v.id_ciudad_origen
      LEFT JOIN ciudad cd     ON cd.id_ciudad = v.id_ciudad_destino
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ${order};
    `;

    const { rows } = await pool.query(q, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error("getVuelos:", err.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getVuelosHorarios(req, res) {
  req.query.orden = "horarios";
  return getVuelos(req, res);
}

async function getVuelosTarifas(req, res) {
  req.query.orden = "tarifas";
  return getVuelos(req, res);
}

async function getVueloInfo(req, res) {
  try {
    const { id } = req.params;
    if (!Number(id)) return res.status(400).json({ message: "ID inválido" });

    const q = `
      SELECT
        v.id_vuelo, v.estado, v.asientos_disponibles,
        v.fecha_salida, v.fecha_llegada,
        EXTRACT(EPOCH FROM (v.fecha_llegada - v.fecha_salida))/60 AS duracion_minutos
      FROM vuelo v
      WHERE v.id_vuelo = $1;
    `;
    const { rows } = await pool.query(q, [id]);
    if (!rows.length)
      return res.status(404).json({ message: "Vuelo no encontrado" });

    const r = rows[0];
    const disponible = Number(r.asientos_disponibles) > 0;
    return res.status(200).json({
      id_vuelo: r.id_vuelo,
      estado: r.estado,
      asientos_disponibles: r.asientos_disponibles,
      duracion_minutos: r.duracion_minutos,
      disponible,
    });
  } catch (err) {
    console.error("getVueloInfo:", err.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getVueloDetalle(req, res) {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        v.id_vuelo,
        v.fecha_salida,
        v.fecha_llegada,
        v.tipo_vuelo,
        v.asientos_disponibles,
        v.precio,
        v.estado        AS estado_vuelo,

        ori.nombre      AS origen_ciudad,
        ori.codigo_iata AS origen_codigo,
        des.nombre      AS destino_ciudad,
        des.codigo_iata AS destino_codigo,

        a.nombre_aerolinea,
        a.codigo_aerolinea,

        av.modelo       AS modelo_avion,
        av.matricula    AS matricula
      FROM vuelo v
      JOIN aerolinea a
        ON v.id_aerolinea = a.id_aerolinea
      JOIN avion av
        ON v.id_avion = av.id_avion
      JOIN ciudad ori
        ON v.id_ciudad_origen = ori.id_ciudad
      JOIN ciudad des
        ON v.id_ciudad_destino = des.id_ciudad
      WHERE v.id_vuelo = $1
        AND v.estado <> 'Cancelado'
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Vuelo no encontrado o no disponible" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error en getVueloDetalle:", error.message);
    return res
      .status(500)
      .json({ message: "Error interno del servidor" });
  }
}

async function updateVuelo(req, res) {
  try {
    const { id } = req.params;
    if (!Number(id)) return res.status(400).json({ message: "ID inválido" });

    const {
      id_aerolinea,
      id_avion,
      id_ciudad_origen,
      id_ciudad_destino,
      fecha_salida,
      fecha_llegada,
      tipo_vuelo,
      asientos_disponibles,
      precio,
      estado,
    } = req.body;

    if (
      !id_aerolinea ||
      !id_avion ||
      !id_ciudad_origen ||
      !id_ciudad_destino ||
      !fecha_salida ||
      !fecha_llegada ||
      !tipo_vuelo ||
      asientos_disponibles == null ||
      precio == null ||
      !estado
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios." });
    }
    if (Number(id_ciudad_origen) === Number(id_ciudad_destino)) {
      return res
        .status(400)
        .json({ message: "Origen y destino no pueden ser iguales." });
    }
    if (new Date(fecha_llegada) <= new Date(fecha_salida)) {
      return res
        .status(400)
        .json({ message: "Llegada debe ser mayor a salida." });
    }

    const q = `
      UPDATE vuelo
      SET id_aerolinea = $1, id_avion = $2, id_ciudad_origen = $3, id_ciudad_destino = $4,
          fecha_salida = $5, fecha_llegada = $6, tipo_vuelo = $7,
          asientos_disponibles = $8, precio = $9, estado = $10
      WHERE id_vuelo = $11
      RETURNING *;
    `;
    const vals = [
      id_aerolinea,
      id_avion,
      id_ciudad_origen,
      id_ciudad_destino,
      fecha_salida,
      fecha_llegada,
      tipo_vuelo,
      asientos_disponibles,
      precio,
      estado,
      id,
    ];
    const { rows } = await pool.query(q, vals);
    if (!rows.length)
      return res.status(404).json({ message: "Vuelo no encontrado" });

    return res
      .status(200)
      .json({ message: "Vuelo actualizado", vuelo: rows[0] });
  } catch (err) {
    console.error("updateVuelo:", err.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function deleteVueloLogico(req, res) {
  try {
    const { id } = req.params;
    if (!Number(id)) return res.status(400).json({ message: "ID inválido" });

    const q = `UPDATE vuelo SET estado = 'Cancelado' WHERE id_vuelo = $1 AND estado <> 'Cancelado' RETURNING *;`;
    const { rows } = await pool.query(q, [id]);

    if (!rows.length) {
      // Puede ser que no exista o ya estaba cancelado
      const exists = await pool.query(
        `SELECT 1 FROM vuelo WHERE id_vuelo = $1`,
        [id]
      );
      if (!exists.rowCount)
        return res.status(404).json({ message: "Vuelo no encontrado" });
      return res.status(200).json({ message: "El vuelo ya estaba cancelado" });
    }
    return res
      .status(200)
      .json({ message: "Vuelo cancelado correctamente", vuelo: rows[0] });
  } catch (err) {
    console.error("deleteVueloLogico:", err.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function ajustarAsientosVuelo(req, res) {
  try {
    const { id } = req.params;
    const { delta } = req.body; // p.ej. { "delta": 2 } => reservar 2 asientos

    if (!Number(id)) return res.status(400).json({ message: "ID inválido" });
    if (!Number.isInteger(delta)) {
      return res
        .status(400)
        .json({
          message:
            "delta debe ser entero (positivos reservan, negativos devuelven)",
        });
    }

    let q, vals;
    if (delta > 0) {
      // Reservar: disminuir si hay cupo
      q = `
        UPDATE vuelo
        SET asientos_disponibles = asientos_disponibles - $1
        WHERE id_vuelo = $2 AND asientos_disponibles >= $1 AND estado NOT IN ('Cancelado')
        RETURNING *;
      `;
      vals = [delta, id];
    } else if (delta < 0) {
      // Devolver asientos (cancelación)
      q = `
        UPDATE vuelo
        SET asientos_disponibles = asientos_disponibles - $1  -- delta negativo => suma
        WHERE id_vuelo = $2 AND estado NOT IN ('Cancelado')
        RETURNING *;
      `;
      vals = [delta, id];
    } else {
      return res.status(400).json({ message: "delta no puede ser 0" });
    }

    const { rows } = await pool.query(q, vals);
    if (!rows.length) {
      return res
        .status(409)
        .json({ message: "No hay asientos suficientes o vuelo no disponible" });
    }

    return res
      .status(200)
      .json({ message: "Asientos actualizados", vuelo: rows[0] });
  } catch (err) {
    console.error("ajustarAsientosVuelo:", err.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

module.exports = {
  createVuelo,
  getVuelo,
  getVuelos,
  getVuelosHorarios,
  getVuelosTarifas,
  getVueloInfo,
  updateVuelo,
  deleteVueloLogico,
  ajustarAsientosVuelo,
  getVueloDetalle,
};
