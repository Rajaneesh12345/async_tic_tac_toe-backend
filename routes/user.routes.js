const express = require("express");
const router = express.Router();
const { signup, login, joinRoom,getRooms } = require("./../controllers/user.controller");
const { authMiddleware } = require("./../middleware/auth.middleware");

router.post("/signup", signup);
router.post("/login", login);
router.post("/challenge", authMiddleware, joinRoom);
router.get("/rooms", authMiddleware, getRooms);

module.exports = router;