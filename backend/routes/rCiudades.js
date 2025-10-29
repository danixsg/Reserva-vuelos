const { Router } = require("express");
const router = Router();

var { getCiudades } = require("../controllers/cCiudades");

router.get("/ciudades", getCiudades);
module.exports = router;
