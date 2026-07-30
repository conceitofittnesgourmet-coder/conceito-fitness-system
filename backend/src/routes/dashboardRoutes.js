const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const { dashboard, dashboardExecutivo } = require("../controllers/dashboardcontroller");

router.get("/", authMiddleware, dashboard);
router.get("/executivo", authMiddleware, dashboardExecutivo);

module.exports = router;
