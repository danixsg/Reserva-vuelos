const { Router } = require("express");
const router = Router();

var {
  getVuelos,
  getVuelosHorarios,
  getVuelosTarifas,
  getVuelo,
  getVueloInfo,
  createVuelo,
  updateVuelo,
  deleteVueloLogico,
  ajustarAsientosVuelo,
  getVueloDetalle,
} = require("../controllers/cVuelos");

//rutas de los endpoint
// Búsqueda/consulta
router.get("/vuelos", getVuelos);
router.get("/vuelos/horarios", getVuelosHorarios);
router.get("/vuelos/tarifas", getVuelosTarifas);
router.get("/vuelo/:id", getVuelo);
router.get("/vuelo/:id/info", getVueloInfo);
router.get("/vuelo/:id/detalle", getVueloDetalle);

// CRUD
router.post("/create-vuelo", createVuelo);
router.put("/update-vuelo/:id", updateVuelo);
router.delete("/delete-vuelo/:id", deleteVueloLogico);

// Helper de stock de asientos
router.patch("/vuelo/:id/asientos", ajustarAsientosVuelo);

module.exports = router;
