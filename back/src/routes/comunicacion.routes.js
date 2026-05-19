const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const ctrl = require("../controllers/comunicacion.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload      = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadVideo = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

router.use(authenticate);

router.get("/avisos",            ctrl.getNotices);
router.post("/avisos",           authorize("PROJECT_MANAGER", "ADMIN_AREA", "COMUNICACION"), ctrl.createNotice);
router.delete("/avisos/:id",     authorize("PROJECT_MANAGER", "ADMIN_AREA", "COMUNICACION"), ctrl.deleteNotice);

router.get("/documentos",        ctrl.getDocuments);
router.post("/documentos",       authorize("PROJECT_MANAGER", "ADMIN_AREA", "COMUNICACION"), upload.single("file"), ctrl.uploadDocument);
router.delete("/documentos/:id", authorize("PROJECT_MANAGER"),                               ctrl.deleteDocument);

router.get("/videos",        ctrl.getVideos);
router.post("/videos",       authorize("PROJECT_MANAGER", "ADMIN_AREA", "COMUNICACION"), uploadVideo.single("file"), ctrl.createVideo);
router.delete("/videos/:id", authorize("PROJECT_MANAGER", "ADMIN_AREA", "COMUNICACION"), ctrl.deleteVideo);

module.exports = router;
