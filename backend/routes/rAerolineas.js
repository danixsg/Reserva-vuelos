const { Router } = require("express");
const router = Router();

var {
  getAerolineas,
  getAerolinea,
  createAerolinea,
  updateAerolinea,
  deleteAerolinea,
} = require("../controllers/cAerolineas");

router.get("/aerolineas", getAerolineas);
router.get("/aerolinea/:id", getAerolinea);
router.post("/create-aerolinea", createAerolinea);
router.put("/update-aerolinea/:id", updateAerolinea);
router.delete("/delete-aerolinea/:id", deleteAerolinea);

module.exports = router;