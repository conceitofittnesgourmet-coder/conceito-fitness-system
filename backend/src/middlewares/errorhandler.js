function errorHandler(err, req, res, next) {

    console.error("\n========================================");
    console.error("🚨 ERRO GLOBAL");
    console.error("========================================");

    console.error("Nome:", err.name);
    console.error("Mensagem:", err.message);

    if (err.stack) {
        console.error("\nSTACK:");
        console.error(err.stack);
    }

    if (err.errors) {
        console.error("\nVALIDATION ERRORS:");
        console.error(err.errors);
    }

    if (err.code) {
        console.error("\nCODE:", err.code);
    }

    console.error("========================================\n");

    return res.status(err.status || 500).json({
        success: false,
        message: err.message || "Erro interno do servidor",
    });

}

module.exports = errorHandler;