const express =
require("express");

const router =
express.Router();

const {

  dashboardMaster

} = require(

  "../controllers/masterController"

);

router.get(
  "/dashboard",
  dashboardMaster
);

module.exports =
router;