const express = require("express");

const router = express.Router();

const auth =
require("../middlewares/authmiddleware");

router.get(
    "/me",
    auth,
    async (req, res) => {

        res.json({
            success: true,
            usuario: req.usuario
        });

    }
);

module.exports = router;