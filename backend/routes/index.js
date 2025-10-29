const express = require('express');
const router = express.Router();

router.use(require('./rUsuarios'));
router.use(require('./rAviones'));
router.use(require('./rCiudades'));
router.use(require('./rFabricantesAvion'));
router.use(require('./rAerolineas'));
router.use(require('./rVuelos'));
router.use(require('./rCategorias'));
router.use(require('./rReservas'));
router.use(require('./rPagos'));
router.use(require('./rTarjetas'));

module.exports = router;
