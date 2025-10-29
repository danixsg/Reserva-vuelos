const { Router } = require("express");
const router = Router();

const { getCategoriasAsiento } = require("../controllers/cCategorias");

// lista de categorías de asiento
router.get("/categorias-asiento", getCategoriasAsiento);

module.exports = router;
