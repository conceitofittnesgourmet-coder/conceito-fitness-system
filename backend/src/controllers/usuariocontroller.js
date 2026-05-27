const Usuario = require("../models/usuario");

const me = async (req, res) => {
    try {

        const usuario = await Usuario.findById(req.usuario.id)
            .select("-senha");

        return res.status(200).json({
            success: true,
            usuario
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Erro ao buscar usuário"
        });

    }
};

module.exports = {
    me
};