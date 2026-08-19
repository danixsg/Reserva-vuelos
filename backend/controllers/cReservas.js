const pool = require("../db/pool");

// POST /reservas
// Body esperado: { id_usuario, id_vuelo, id_categoria }
async function createReserva(req, res) {
  const client = await pool.connect();
  try {
    const { id_usuario, id_vuelo, id_categoria } = req.body;

    if (!id_usuario || !id_vuelo || !id_categoria) {
      return res.status(400).json({
        message:
          "Faltan datos obligatorios: id_usuario, id_vuelo, id_categoria",
      });
    }

    // Iniciar transacción
    await client.query("BEGIN");

    // 1. Traer info del vuelo y bloquear fila
    const vueloData = await client.query(
      `
      SELECT asientos_disponibles, estado
      FROM vuelo
      WHERE id_vuelo = $1
        AND estado <> 'Cancelado'
      FOR UPDATE
      `,
      [id_vuelo]
    );

    if (vueloData.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Vuelo no encontrado o no disponible" });
    }

    const { asientos_disponibles, estado: estadoVuelo } = vueloData.rows[0];

    if (estadoVuelo !== "Programado" && estadoVuelo !== "Activo") {
      // depende de cómo estés manejando los estados de vuelo
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Este vuelo no está disponible para reserva",
      });
    }

    if (asientos_disponibles <= 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "No hay asientos disponibles en este vuelo" });
    }

    // 2. Insertar reserva (1 asiento reservado)
    const reservaInsert = await client.query(
      `
      INSERT INTO reserva (
        id_usuario,
        id_vuelo,
        id_categoria,
        fecha_reserva,
        estado
      )
      VALUES (
        $1,
        $2,
        $3,
        NOW(),
        'Pendiente'
      )
      RETURNING id_reserva, id_usuario, id_vuelo, id_categoria, fecha_reserva, estado
      `,
      [id_usuario, id_vuelo, id_categoria]
    );

    const reserva = reservaInsert.rows[0];

    // 3. Descontar 1 asiento del vuelo
    await client.query(
      `
      UPDATE vuelo
      SET asientos_disponibles = asientos_disponibles - 1
      WHERE id_vuelo = $1
      `,
      [id_vuelo]
    );

    // 4. Confirmar transacción
    await client.query("COMMIT");

    // 5. Responder
    return res.status(201).json({
      message: "Reserva creada correctamente",
      reserva,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en createReserva:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  } finally {
    client.release();
  }
}

/**
 * GET /reservas/usuario/:id_usuario
 * Lista TODAS las reservas del usuario con datos del vuelo.
 */
async function getReservasUsuario(req, res) {
  try {
    const { id_usuario } = req.params;
    if (!id_usuario) {
      return res.status(400).json({ message: "Falta id_usuario en la URL." });
    }

    const query = `
      SELECT
        r.id_reserva,
        r.id_usuario,
        r.id_vuelo,
        r.id_categoria,
        r.fecha_reserva,
        r.estado              AS estado_reserva,

        v.fecha_salida,
        v.fecha_llegada,
        v.tipo_vuelo,
        v.estado              AS estado_vuelo,
        v.asientos_disponibles,
        v.precio              AS precio_base,

        a.nombre_aerolinea,
        a.codigo_aerolinea,

        ori.nombre            AS origen_ciudad,
        ori.codigo_iata       AS origen_codigo,
        dest.nombre           AS destino_ciudad,
        dest.codigo_iata      AS destino_codigo,

        c.categoria           AS nombre_categoria,
        c.rango_inicio,
        c.rango_fin,
        c.precio_categoria
      FROM reserva r
      JOIN vuelo v              ON v.id_vuelo = r.id_vuelo
      JOIN aerolinea a          ON a.id_aerolinea = v.id_aerolinea
      JOIN ciudad ori           ON ori.id_ciudad = v.id_ciudad_origen
      JOIN ciudad dest          ON dest.id_ciudad = v.id_ciudad_destino
      LEFT JOIN categoria_asiento c
        ON c.id_categoria = r.id_categoria
      WHERE r.id_usuario = $1
      ORDER BY r.id_reserva DESC
    `;

    const { rows } = await pool.query(query, [id_usuario]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("getReservasUsuario:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor (listar reservas)",
      detalle: error.message,
    });
  }
}

/**
 * GET /reservas?usuario=123
 * Misma lógica que arriba pero usando query param.
 */
async function getReservasUsuarioQuery(req, res) {
  try {
    const { usuario } = req.query;
    if (!usuario) {
      return res.status(400).json({ message: "Falta query param 'usuario'." });
    }

    const query = `
      SELECT
        r.id_reserva,
        r.id_usuario,
        r.id_vuelo,
        r.id_categoria,
        r.fecha_reserva,
        r.estado              AS estado_reserva,

        v.fecha_salida,
        v.fecha_llegada,
        v.tipo_vuelo,
        v.estado              AS estado_vuelo,
        v.asientos_disponibles,
        v.precio              AS precio_base,

        a.nombre_aerolinea,
        a.codigo_aerolinea,

        ori.nombre            AS origen_ciudad,
        ori.codigo_iata       AS origen_codigo,
        dest.nombre           AS destino_ciudad,
        dest.codigo_iata      AS destino_codigo,

        c.categoria           AS nombre_categoria,
        c.rango_inicio,
        c.rango_fin,
        c.precio_categoria
      FROM reserva r
      JOIN vuelo v              ON v.id_vuelo = r.id_vuelo
      JOIN aerolinea a          ON a.id_aerolinea = v.id_aerolinea
      JOIN ciudad ori           ON ori.id_ciudad = v.id_ciudad_origen
      JOIN ciudad dest          ON dest.id_ciudad = v.id_ciudad_destino
      LEFT JOIN categoria_asiento c
        ON c.id_categoria = r.id_categoria
      WHERE r.id_usuario = $1
      ORDER BY r.id_reserva DESC
    `;

    const { rows } = await pool.query(query, [usuario]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("getReservasUsuarioQuery:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor (listar reservas por query param)",
      detalle: error.message,
    });
  }
}

/**
 * GET /usuarios/:id_usuario/reservas
 * Alias extra por si necesitas ese path.
 */
async function getReservasUsuarioAlias(req, res) {
  try {
    const { id_usuario } = req.params;
    if (!id_usuario) {
      return res.status(400).json({ message: "Falta id_usuario en la URL." });
    }

    const query = `
      SELECT
        r.id_reserva,
        r.id_usuario,
        r.id_vuelo,
        r.id_categoria,
        r.fecha_reserva,
        r.estado              AS estado_reserva,

        v.fecha_salida,
        v.fecha_llegada,
        v.tipo_vuelo,
        v.estado              AS estado_vuelo,
        v.asientos_disponibles,
        v.precio              AS precio_base,

        a.nombre_aerolinea,
        a.codigo_aerolinea,

        ori.nombre            AS origen_ciudad,
        ori.codigo_iata       AS origen_codigo,
        dest.nombre           AS destino_ciudad,
        dest.codigo_iata      AS destino_codigo,

        c.categoria           AS nombre_categoria,
        c.rango_inicio,
        c.rango_fin,
        c.precio_categoria
      FROM reserva r
      JOIN vuelo v              ON v.id_vuelo = r.id_vuelo
      JOIN aerolinea a          ON a.id_aerolinea = v.id_aerolinea
      JOIN ciudad ori           ON ori.id_ciudad = v.id_ciudad_origen
      JOIN ciudad dest          ON dest.id_ciudad = v.id_ciudad_destino
      LEFT JOIN categoria_asiento c
        ON c.id_categoria = r.id_categoria
      WHERE r.id_usuario = $1
      ORDER BY r.id_reserva DESC
    `;

    const { rows } = await pool.query(query, [id_usuario]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("getReservasUsuarioAlias:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor (listar reservas alias)",
      detalle: error.message,
    });
  }
}

/**
 * PATCH /reservas/:id_reserva/cancelar
 * Cambia el estado a 'Cancelada' SOLO si está en 'Pendiente'.
 * Usa transacción para bloquear la fila y evitar condiciones de carrera.
 */
async function cancelarReserva(req, res) {
  const client = await pool.connect();
  try {
    const { id_reserva } = req.params;
    if (!id_reserva) {
      client.release();
      return res.status(400).json({ message: "Falta id_reserva en la URL." });
    }

    // Iniciar transacción
    await client.query("BEGIN");

    // 1) Traer la reserva y bloquearla
    //    Necesitamos estado + id_vuelo
    const sel = await client.query(
      `
      SELECT id_reserva, id_vuelo, estado
      FROM reserva
      WHERE id_reserva = $1
      FOR UPDATE
      `,
      [id_reserva]
    );

    if (sel.rows.length === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ message: "Reserva no encontrada." });
    }

    const { id_vuelo, estado: estadoActual } = sel.rows[0];

    // 2) Validar estado
    if (estadoActual !== "Pendiente") {
      await client.query("ROLLBACK");
      client.release();
      return res.status(409).json({
        message: "Solo se pueden cancelar reservas en estado 'Pendiente'.",
        reserva: {
          id_reserva: sel.rows[0].id_reserva,
          estado: estadoActual,
        },
      });
    }

    // 3) Actualizar la reserva a Cancelada
    const updReserva = await client.query(
      `
      UPDATE reserva
      SET estado = 'Cancelada'
      WHERE id_reserva = $1
      RETURNING id_reserva, estado
      `,
      [id_reserva]
    );

    // 4) Devolver el asiento al vuelo correspondiente
    //    Bloqueamos la fila del vuelo antes de modificar asientos_disponibles
    await client.query(
      `
      UPDATE vuelo
      SET asientos_disponibles = asientos_disponibles + 1
      WHERE id_vuelo = $1
      `,
      [id_vuelo]
    );

    // 5) Confirmar transacción
    await client.query("COMMIT");
    client.release();

    // 6) Responder
    return res.status(200).json({
      message: "Reserva cancelada.",
      reserva: {
        id_reserva: updReserva.rows[0].id_reserva,
        estado: updReserva.rows[0].estado,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    client.release();

    console.error("cancelarReserva:", error.message);

    return res.status(500).json({
      message: "Error interno del servidor (cancelar reserva)",
      detalle: error.message,
    });
  }
}

async function getAllReservasAdmin(req, res) {
  try {
    const query = `
      SELECT
        r.id_reserva,
        r.id_usuario,
        -- Unimos el nombre y apellido del cliente en un solo campo
        CONCAT(u.p_nombre, ' ', u.p_apellido) AS nombre_cliente,
        r.fecha_reserva,
        r.estado AS estado_reserva,
        v.fecha_salida,
        a.nombre_aerolinea,
        ori.codigo_iata AS origen_codigo,
        dest.codigo_iata AS destino_codigo
      FROM reserva r
      JOIN vuelo v ON v.id_vuelo = r.id_vuelo
      JOIN aerolinea a ON a.id_aerolinea = v.id_aerolinea
      JOIN ciudad ori ON ori.id_ciudad = v.id_ciudad_origen
      JOIN ciudad dest ON dest.id_ciudad = v.id_ciudad_destino
      JOIN usuario u ON u.id_usuario = r.id_usuario
      ORDER BY r.id_reserva DESC
    `;
    
    const { rows } = await pool.query(query);
    return res.status(200).json(rows);

  } catch (error) {
    console.error("getAllReservasAdmin:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor al listar todas las reservas",
      detalle: error.message,
    });
  }
}

/**
 * PUT /reservas/:id_reserva
 * Cambiar el estado explícitamente.
 * Permitidos: 'Pendiente', 'Confirmada', 'Cancelada'.
 * OJO: esto no hace lógica extra (no descuenta asientos, no envía correo),
 * solo actualiza la columna.
 */
async function actualizarEstadoReserva(req, res) {
  try {
    const { id_reserva } = req.params;
    const { estado } = req.body;

    if (!id_reserva || !estado) {
      return res.status(400).json({
        message: "Faltan datos. Requiere id_reserva en URL y 'estado' en body.",
      });
    }

    const permitidos = new Set(["Pendiente", "Confirmada", "Cancelada"]);
    if (!permitidos.has(estado)) {
      return res.status(400).json({
        message:
          "Estado inválido. Permitidos: 'Pendiente', 'Confirmada', 'Cancelada'.",
      });
    }

    const upd = await pool.query(
      `
        UPDATE reserva
        SET estado = $2
        WHERE id_reserva = $1
        RETURNING id_reserva, estado
      `,
      [id_reserva, estado]
    );

    if (upd.rows.length === 0) {
      return res.status(404).json({ message: "Reserva no encontrada." });
    }

    return res.status(200).json({
      message: "Estado actualizado.",
      reserva: {
        id_reserva: upd.rows[0].id_reserva,
        estado: upd.rows[0].estado,
      },
    });
  } catch (error) {
    console.error("actualizarEstadoReserva:", error.message);
    return res.status(500).json({
      message: "Error interno del servidor (actualizar estado)",
      detalle: error.message,
    });
  }
}

/**
 * DELETE /reservas/:id_reserva
 * Alias legacy: "borrar" = cancelar.
 * Mismo efecto que PATCH /cancelar: pone 'Cancelada' si estaba 'Pendiente'.
 */
async function eliminarReserva(req, res) {
  const client = await pool.connect();
  try {
    const { id_reserva } = req.params;
    if (!id_reserva) {
      client.release();
      return res.status(400).json({ message: "Falta id_reserva en la URL." });
    }

    await client.query("BEGIN");

    // Bloqueamos la reserva
    const sel = await client.query(
      `
        SELECT id_reserva, estado
        FROM reserva
        WHERE id_reserva = $1
        FOR UPDATE
      `,
      [id_reserva]
    );

    if (sel.rows.length === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ message: "Reserva no encontrada." });
    }

    const estadoActual = sel.rows[0].estado;
    if (estadoActual !== "Pendiente") {
      await client.query("ROLLBACK");
      client.release();
      return res.status(409).json({
        message:
          "No se puede eliminar. Solo se pueden cancelar reservas en 'Pendiente'.",
        reserva: {
          id_reserva: sel.rows[0].id_reserva,
          estado: estadoActual,
        },
      });
    }

    const upd = await client.query(
      `
        UPDATE reserva
        SET estado = 'Cancelada'
        WHERE id_reserva = $1
        RETURNING id_reserva, estado
      `,
      [id_reserva]
    );

    await client.query("COMMIT");
    client.release();

    return res.status(200).json({
      message: "Reserva cancelada.",
      reserva: {
        id_reserva: upd.rows[0].id_reserva,
        estado: upd.rows[0].estado,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    client.release();
    console.error("eliminarReserva:", error.message);

    return res.status(500).json({
      message: "Error interno del servidor (eliminar reserva)",
      detalle: error.message,
    });
  }
}

module.exports = {
  createReserva,
  getReservasUsuario,
  getAllReservasAdmin,
  getReservasUsuarioAlias,
  getReservasUsuarioQuery,
  cancelarReserva,
  actualizarEstadoReserva,
  eliminarReserva,
};
