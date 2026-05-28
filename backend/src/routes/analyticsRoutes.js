const express =
require("express");

const router =
express.Router();

const {

  getAnalytics

} = require(

  "../controllers/analyticscontroller"

);

router.get(
  "/",
  getAnalytics
);

module.exports =
router;