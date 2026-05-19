const router = require("express").Router();
const { authenticate } = require("../middlewares/auth.middleware");
const { listAll, listPending, approve, reject, remove } = require("../controllers/device.controller");

const canManage = (req, res, next) => {
  if (!["PROJECT_MANAGER", "RRHH"].includes(req.user.role)) {
    return res.status(403).json({ error: "Sin permiso" });
  }
  next();
};

router.use(authenticate);
router.get(    "/",            canManage, listAll);
router.get(    "/pending",     canManage, listPending);
router.put(    "/:id/approve", canManage, approve);
router.put(    "/:id/reject",  canManage, reject);
router.delete( "/:id",         canManage, remove);

module.exports = router;
