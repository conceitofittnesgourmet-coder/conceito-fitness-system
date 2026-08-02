const Produto = require("../models/produto");

class ProdutoFiscalService {

    async listar() {

        const produtos = await Produto.find(
            {},
            {
                nome: 1,
                codigoBarras: 1,
                sku: 1,
                dadosFiscais: 1,
                ativo: 1
            }
        ).sort({ nome: 1 });

        return produtos.map(produto => {

            const fiscal = produto.dadosFiscais || {};

            const pendencias = [];

            if (!fiscal.ncm) pendencias.push("NCM");
            if (!fiscal.cfopInterno) pendencias.push("CFOP");
            if (!fiscal.csosn) pendencias.push("CSOSN");

            return {

                _id: produto._id,

                nome: produto.nome,

                codigoBarras: produto.codigoBarras,

                sku: produto.sku,

                ativo: produto.ativo,

                dadosFiscais: fiscal,

                pendencias,

                statusFiscal:
                    pendencias.length === 0
                        ? "completo"
                        : "pendente"

            };

        });

    }

    async buscar(id) {

        return Produto.findById(id);

    }

    async atualizar(id, dados) {

        const produto = await Produto.findById(id);

        if (!produto)
            throw new Error("Produto não encontrado.");

        produto.dadosFiscais = {

            ...produto.dadosFiscais,

            ...dados

        };

        produto.historicoFiscal.push({

            alteradoEm: new Date(),

            alteradoPor: "ERP",

            origem: "cadastro_fiscal",

            campos: dados

        });

        await produto.save();

        return produto;

    }

    async auditoria() {

        const produtos = await Produto.find(
            {},
            {
                nome: 1,
                dadosFiscais: 1
            }
        );

        let completos = 0;

        let pendentes = 0;

        let semNcm = 0;

        let semCfop = 0;

        let semCsosn = 0;

        const listaPendencias = [];

        for (const produto of produtos) {

            const fiscal = produto.dadosFiscais || {};

            const erros = [];

            if (!fiscal.ncm) {

                erros.push("NCM");

                semNcm++;

            }

            if (!fiscal.cfopInterno) {

                erros.push("CFOP");

                semCfop++;

            }

            if (!fiscal.csosn) {

                erros.push("CSOSN");

                semCsosn++;

            }

            if (erros.length === 0) {

                completos++;

            } else {

                pendentes++;

                listaPendencias.push({

                    id: produto._id,

                    nome: produto.nome,

                    pendencias: erros

                });

            }

        }

        return {

            totalProdutos: produtos.length,

            completos,

            pendentes,

            semNcm,

            semCfop,

            semCsosn,

            produtosPendentes: listaPendencias

        };

    }

}

module.exports = new ProdutoFiscalService();