const { Router } = require("express");
const router = Router();

var {
  getFabricantes,
  createFabricante,
  getFabricante,
  updateFabricante,
  deleteFabricante,
} = require("../controllers/cFabricantesAvion");

router.get("/fabricantes", getFabricantes);
router.post("/fabricantes", createFabricante);
router.get("/fabricantes/:id", getFabricante);
router.put("/update-fabricante/:id", updateFabricante);
router.delete("/delete-fabricantes/:id", deleteFabricante);
module.exports = router;
