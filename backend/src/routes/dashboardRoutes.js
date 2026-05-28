const express =
  require("express");

const router =
  express.Router();

const authMiddleware =
  require(
    "../middlewares/authmiddleware"
  );

const {
  dashboard
} = require(
  "../controllers/dashboardcontroller"
);

router.get(
  "/",
  authMiddleware,
  dashboard
);

module.exports =
  router;