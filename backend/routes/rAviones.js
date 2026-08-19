const { Router } = require("express");
const router = Router();

var {
  insertarAvion,
  getAviones,
  updateAvion,
  deleteAvion,
} = require("../controllers/cAviones");

//rutas de los endpoint
router.get("/aviones", getAviones);
router.post("/create-avion", insertarAvion);
router.put("/update-avion/:id", updateAvion);
router.delete("/delete-avion/:id", deleteAvion);

module.exports = router;
