const router = require("express").Router();
const ctrl = require("../controllers/reporte.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.get("/",       authorize("PROJECT_MANAGER", "ADMIN_AREA", "RRHH"), ctrl.getAll);
router.post("/",      authorize("PROJECT_MANAGER", "ADMIN_AREA", "RRHH"), ctrl.create);
router.delete("/:id", authorize("PROJECT_MANAGER"),                        ctrl.remove);

module.exports = router;
