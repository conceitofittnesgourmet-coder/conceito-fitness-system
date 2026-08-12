const verifyToken = require("../middlewares/verifytoken");
const empresa = require("../middlewares/empresa");

router.get(
    "/",
    verifyToken,
    empresa,
    controller.buscarConfiguracao
);

router.get(
    "/status",
    verifyToken,
    empresa,
    controller.statusFiscal
);

router.put(
    "/",
    verifyToken,
    empresa,
    controller.salvarConfiguracao
);