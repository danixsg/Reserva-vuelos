const { Router } = require("express");
const router = Router();

var {
  register,
  login,
  getUsuario,
  updateUsuario,
  deleteUsuario,
  restablecerUsuario,
  updatePassword,
  enviarCorreoRecuperacion,
  updatePasswordRec,
  updateUsuarioAdmin,
  getUsuarioById,
  getUsuarios,
  updateUsuarioEstado,
} = require("../controllers/cUsuarios");

//rutas de los endpoint
router.get("/get-usuario/:id", getUsuario);

router.post("/register", register);
router.post("/login", login);
router.post("/recuperar-cuenta", enviarCorreoRecuperacion);

router.put("/update-usuario/:id", updateUsuario);
router.put("/restablecer-usuario/:id", restablecerUsuario);
router.put("/update-password/:id", updatePassword);
router.put("/update-password-rec/:id", updatePasswordRec);

router.delete("/delete-usuario/:id", deleteUsuario);

router.get("/usuarios", getUsuarios);
router.get("/usuarios/:id", getUsuarioById);
router.put("/usuarios/:id", updateUsuarioAdmin);
router.put("/usuarios/:id/estado", updateUsuarioEstado);
router.delete("/usuarios/:id", deleteUsuario);

module.exports = router;
