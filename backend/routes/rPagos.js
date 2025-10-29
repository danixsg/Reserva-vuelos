const { Router } = require("express");
const router = Router();

const {
  getTarjetasUsuario,
  createTarjetaUsuario,
  getCheckoutInfo,
  createCompra,
  reenviarCorreoCompra,
  getCompraByReserva,
} = require("../controllers/cPagos");

// tarjetas
router.get("/tarjetas/:id_usuario", getTarjetasUsuario);
router.get("/compra/:id_reserva", getCompraByReserva);
router.post("/tarjetas", createTarjetaUsuario);

// checkout resumen
router.get("/checkout/:id_reserva", getCheckoutInfo);

// compra final (esto también dispara el correo)
router.post("/compras", createCompra);

// reenviar correo de confirmación manualmente si quieres debug
router.post("/correo-compra/:id_compra", reenviarCorreoCompra);

module.exports = router;
