const router = require("express").Router();
const ctrl = require("../controllers/indicadores.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.get("/",       ctrl.getAll);
router.get("/latest", ctrl.getLatest);
router.post("/",      authorize("PROJECT_MANAGER", "ADMIN_AREA"), ctrl.create);
router.put("/:id",    authorize("PROJECT_MANAGER", "ADMIN_AREA"), ctrl.update);
router.delete("/:id", authorize("PROJECT_MANAGER"),               ctrl.remove);

module.exports = router;
