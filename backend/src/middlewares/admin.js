function adminMiddleware(
    req,
    res,
    next
) {

    if (
        req.usuario.role !==
        "superadmin"
    ) {

        return res.status(403).json({

            success: false,

            message:
                "Acesso negado"
        });
    }

    next();
}

module.exports =
    adminMiddleware;