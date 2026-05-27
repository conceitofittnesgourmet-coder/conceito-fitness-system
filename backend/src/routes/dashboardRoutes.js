const express =
  require("express");

const router =
  express.Router();

const authMiddleware =
  require(
    "../middlewares/authMiddleware"
  );

const {
  dashboard
} = require(
  "../controllers/dashboardController"
);

router.get(
  "/",
  authMiddleware,
  dashboard
);

module.exports =
  router;