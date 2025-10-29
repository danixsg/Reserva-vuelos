const { Router } = require("express");
const router = Router();

const {
  getTarjetasPorUsuario,
  createTarjeta,
  deleteTarjeta,
} = require("../controllers/cTarjetaCredito"); 

router.get("/tarjetas/usuario/:id_usuario", getTarjetasPorUsuario);
router.post("/tarjetas", createTarjeta);
router.delete("/tarjetas/:id_tarjeta", deleteTarjeta);

module.exports = router;