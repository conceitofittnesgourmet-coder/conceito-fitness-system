const NotaFiscalEntrada = require("../models/notafiscalentrada");
const Fornecedor = require("../models/fornecedor");
const MateriaPrima = require("../models/materiaprima");
const ContaPagar = require("../models/contapagar");
const MovimentacaoFinanceira = require("../models/movimentacaofinanceira");
const xml2js = require("xml2js");

function numero(valor) {
  return Number(valor || 0);
}

exports.listarNotasEntrada = async (req, res) => {
  try {
    const notas = await NotaFiscalEntrada.find()
      .populate("fornecedor")
      .populate("itens.materiaPrima")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      notas,
    });
  } catch (error) {
    console.log("ERRO LISTAR NOTAS ENTRADA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.criarNotaEntrada = async (req, res) => {
  try {
    const {
      numero,
      serie,
      chaveAcesso,
      fornecedor,
      fornecedorNome,
      fornecedorDocumento,
      dataEmissao,
      valorFrete,
      valorDesconto,
      formaPagamento,
      observacao,
      itens,
    } = req.body || {};

    if (!numero) {
      return res.status(400).json({
        success: false,
        message: "Número da nota fiscal é obrigatório.",
      });
    }

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A nota precisa ter pelo menos um item.",
      });
    }

    let fornecedorEncontrado = null;

    if (fornecedor) {
      fornecedorEncontrado = await Fornecedor.findById(fornecedor);
    }

    const itensCalculados = [];
    let valorProdutos = 0;

    for (const item of itens) {
      const quantidade = numero(item.quantidade);
      const valorUnitario = numero(item.valorUnitario);
      const valorTotal = quantidade * valorUnitario;

      valorProdutos += valorTotal;

      let materia = null;

if (
  item.materiaPrima &&
  item.materiaPrima !== "null" &&
  item.materiaPrima !== ""
) {
  materia = await MateriaPrima.findById(item.materiaPrima);
}

      itensCalculados.push({
        materiaPrima: materia?._id || null,
        nome: item.nome || materia?.nome || "Item da nota",
        codigo: item.codigo || "",
        unidade: item.unidade || materia?.unidade || "unidade",
        quantidade,
        valorUnitario,
        valorTotal,
      });

      if (materia) {
        materia.estoqueAtual = numero(materia.estoqueAtual) + quantidade;
        materia.custoUnitario = valorUnitario;
        await materia.save();
      }
    }

    const totalNota =
      numero(valorProdutos) + numero(valorFrete) - numero(valorDesconto);

    const nota = await NotaFiscalEntrada.create({
      numero,
      serie: serie || "",
      chaveAcesso: chaveAcesso || "",
      fornecedor: fornecedorEncontrado?._id || null,
      fornecedorNome:
        fornecedorEncontrado?.nome || fornecedorNome || "Fornecedor não informado",
      fornecedorDocumento: fornecedorDocumento || "",
      dataEmissao: dataEmissao ? new Date(dataEmissao) : new Date(),
      dataEntrada: new Date(),
      valorProdutos: Number(valorProdutos.toFixed(2)),
      valorFrete: numero(valorFrete),
      valorDesconto: numero(valorDesconto),
      valorTotal: Number(totalNota.toFixed(2)),
      formaPagamento: formaPagamento || "PIX",
      status: "entrada_realizada",
      itens: itensCalculados,
      xmlImportado: false,
      observacao: observacao || "",
    });

    await ContaPagar.create({
      descricao: `NF Entrada ${numero}/${serie || ""}`,
      categoria: "Nota Fiscal Entrada",
      fornecedor: nota.fornecedorNome,
      valor: nota.valorTotal,
      vencimento: new Date(),
      dataPagamento: new Date(),
      status: "paga",
      formaPagamento: nota.formaPagamento,
      observacao: "Gerado automaticamente pela entrada de nota fiscal.",
    });

    await MovimentacaoFinanceira.create({
      tipo: "saida",
      origem: "nota_fiscal_entrada",
      descricao: `NF Entrada ${numero}/${serie || ""}`,
      categoria: "Fiscal",
      valor: nota.valorTotal,
      formaPagamento: nota.formaPagamento,
      observacao: "Saída automática gerada pela entrada de nota fiscal.",
    });

    return res.status(201).json({
      success: true,
      nota,
    });
  } catch (error) {
    console.log("ERRO CRIAR NOTA ENTRADA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.buscarNotaEntrada = async (req, res) => {
  try {
    const nota = await NotaFiscalEntrada.findById(req.params.id)
      .populate("fornecedor")
      .populate("itens.materiaPrima");

    if (!nota) {
      return res.status(404).json({
        success: false,
        message: "Nota fiscal não encontrada.",
      });
    }

    return res.json({
      success: true,
      nota,
    });
  } catch (error) {
    console.log("ERRO BUSCAR NOTA ENTRADA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.cancelarNotaEntrada = async (req, res) => {
  try {
    const nota = await NotaFiscalEntrada.findById(req.params.id);

    if (!nota) {
      return res.status(404).json({
        success: false,
        message: "Nota fiscal não encontrada.",
      });
    }

    nota.status = "cancelada";
    await nota.save();

    return res.json({
      success: true,
      nota,
    });
  } catch (error) {
    console.log("ERRO CANCELAR NOTA ENTRADA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.resumoFiscal = async (req, res) => {
  try {
    const notas = await NotaFiscalEntrada.find();

    const totalNotas = notas.length;

    const valorTotalEntrada = notas
      .filter((n) => n.status !== "cancelada")
      .reduce((acc, nota) => acc + numero(nota.valorTotal), 0);

    const notasCanceladas = notas.filter((n) => n.status === "cancelada").length;
    const notasXml = notas.filter((n) => n.xmlImportado).length;

    return res.json({
      success: true,
      resumo: {
        totalNotas,
        valorTotalEntrada,
        notasCanceladas,
        notasXml,
      },
    });
  } catch (error) {
    console.log("ERRO RESUMO FISCAL:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.importarXmlNotaEntrada = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Nenhum XML enviado.",
      });
    }

    const xml = req.file.buffer.toString("utf8");

    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      trim: true,
    });

    const resultado = await parser.parseStringPromise(xml);

    const nfe =
      resultado?.nfeProc?.NFe?.infNFe ||
      resultado?.NFe?.infNFe ||
      resultado?.nfeProc?.NFe?.infNFe;

    if (!nfe) {
      return res.status(400).json({
        success: false,
        message: "XML inválido ou estrutura de NF-e não reconhecida.",
      });
    }

    const ide = nfe.ide || {};
    const emit = nfe.emit || {};
    const total = nfe.total?.ICMSTot || {};

    const chaveAcesso =
      nfe.Id?.replace("NFe", "") ||
      resultado?.nfeProc?.protNFe?.infProt?.chNFe ||
      "";

    const detRaw = nfe.det || [];
    const detArray = Array.isArray(detRaw) ? detRaw : [detRaw];

    const itens = detArray.map((det) => {
      const prod = det.prod || {};

      const quantidade = Number(prod.qCom || 0);
      const valorUnitario = Number(prod.vUnCom || 0);
      const valorTotal = Number(prod.vProd || quantidade * valorUnitario || 0);

      return {
        materiaPrima: null,
        nome: prod.xProd || "Produto da nota",
        codigo: prod.cProd || "",
        unidade: prod.uCom || "unidade",
        quantidade,
        valorUnitario,
        valorTotal,
      };
    });

    const nota = {
      numero: ide.nNF || "",
      serie: ide.serie || "",
      chaveAcesso,
      fornecedorNome: emit.xNome || "",
      fornecedorDocumento: emit.CNPJ || emit.CPF || "",
      dataEmissao: ide.dhEmi
        ? new Date(ide.dhEmi).toISOString().slice(0, 10)
        : ide.dEmi
        ? new Date(ide.dEmi).toISOString().slice(0, 10)
        : "",
      valorFrete: Number(total.vFrete || 0),
      valorDesconto: Number(total.vDesc || 0),
      valorProdutos: Number(total.vProd || 0),
      valorTotal: Number(total.vNF || 0),
      formaPagamento: "BOLETO",
      observacao: "Importado automaticamente por XML.",
      itens,
    };

    return res.json({
      success: true,
      nota,
    });
  } catch (error) {
    console.log("ERRO IMPORTAR XML NF-E:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};