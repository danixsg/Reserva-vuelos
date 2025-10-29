const { Router } = require("express");
const router = Router();

const { createReserva, getReservasUsuario, getReservasUsuarioAlias, getReservasUsuarioQuery, cancelarReserva, actualizarEstadoReserva, eliminarReserva, getAllReservasAdmin } = require("../controllers/cReservas");

// Crear reserva
router.post("/reservas", createReserva);

// Listar todas las reservas del usuario logueado
router.get("/reservas/usuario/:id_usuario", getReservasUsuario);

// Alias tipo /usuarios/123/reservas
router.get("/usuarios/:id_usuario/reservas", getReservasUsuarioAlias);

// Alias tipo /reservas?usuario=123
router.get("/reservas", getReservasUsuarioQuery);

// Cancelar (solo si está Pendiente)
router.post("/reservas/:id_reserva/cancelar", cancelarReserva);

// Fallback para actualizar estado manualmente (Confirmada / Cancelada, etc.)
router.put("/reservas/:id_reserva", actualizarEstadoReserva);

// Fallback DELETE (front viejo que intenta "eliminar")
router.delete("/reservas/:id_reserva", eliminarReserva);

router.get("/reservas/admin/all", getAllReservasAdmin);

module.exports = router;
