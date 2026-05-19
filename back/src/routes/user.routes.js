const router = require("express").Router();
const { getAll, getById, create, update, remove } = require("../controllers/user.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.get("/",      authorize("PROJECT_MANAGER", "ADMIN_AREA", "RRHH"), getAll);
router.get("/:id",   authorize("PROJECT_MANAGER", "ADMIN_AREA", "RRHH"), getById);
router.post("/",     authorize("PROJECT_MANAGER", "RRHH"),               create);
router.put("/:id",   authorize("PROJECT_MANAGER", "RRHH"),               update);
router.delete("/:id",authorize("PROJECT_MANAGER"),                        remove);

module.exports = router;
