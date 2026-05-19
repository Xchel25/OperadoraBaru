const router = require("express").Router();
const multer = require("multer");
const path   = require("path");
const ctrl   = require("../controllers/capacitacion.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const uploadCourse = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
}).fields([
  { name: "videoFile",      maxCount: 1 },
  { name: "attachmentFile", maxCount: 1 },
]);

router.use(authenticate);

router.get("/cursos",        ctrl.getCourses);
router.post("/cursos",       authorize("PROJECT_MANAGER", "ADMIN_AREA"), uploadCourse, ctrl.createCourse);
router.put("/cursos/:id",    authorize("PROJECT_MANAGER", "ADMIN_AREA"), uploadCourse, ctrl.updateCourse);
router.delete("/cursos/:id", authorize("PROJECT_MANAGER"),               ctrl.deleteCourse);

router.get("/progreso",      ctrl.getMyProgress);
router.post("/progreso",     ctrl.updateProgress);

module.exports = router;
