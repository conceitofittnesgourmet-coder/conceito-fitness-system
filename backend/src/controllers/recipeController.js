"use strict";

const RecipeService = require("../services/recipe/RecipeService");

class RecipeController {

    async listar(req, res, next) {

        try {

            const empresa = req.usuario?.empresa;

            const receitas =
                await RecipeService.listar(empresa);

            return res.json({
                success: true,
                data: receitas
            });

        } catch (err) {

            next(err);

        }

    }

    async buscar(req, res, next) {

        try {

            const receita =
                await RecipeService.buscarPorId(
                    req.params.id
                );

            if (!receita) {

                return res.status(404).json({

                    success: false,

                    message: "Receita não encontrada."

                });

            }

            return res.json({

                success: true,

                data: receita

            });

        } catch (err) {

            next(err);

        }

    }

    async criar(req, res, next) {

        try {

            const receita =
                await RecipeService.criar(req.body);

            return res.status(201).json({

                success: true,

                data: receita

            });

        } catch (err) {

            next(err);

        }

    }

    async atualizar(req, res, next) {

        try {

            const receita =
                await RecipeService.atualizar(
                    req.params.id,
                    req.body
                );

            return res.json({

                success: true,

                data: receita

            });

        } catch (err) {

            next(err);

        }

    }

    async excluir(req, res, next) {

        try {

            await RecipeService.excluir(req.params.id);

            return res.json({

                success: true

            });

        } catch (err) {

            next(err);

        }

    }

}

module.exports = new RecipeController();