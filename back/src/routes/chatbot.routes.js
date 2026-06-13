const router = require("express").Router();
const { authenticate } = require("../middlewares/auth.middleware");
const { chat } = require("../controllers/chatbot.controller");

router.post("/mensaje", authenticate, chat);

module.exports = router;
