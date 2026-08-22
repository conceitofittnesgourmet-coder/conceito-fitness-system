const NotaFiscalEntrada = require("../models/notafiscalentrada");
const Fornecedor = require("../models/fornecedor");
const MateriaPrima = require("../models/materiaprima");
const Compra = require("../models/compra");
const ContaPagar = require("../models/contapagar");
const MovimentacaoFinanceira = require("../models/movimentacaofinanceira");
const xml2js = require("xml2js");
const {
  buscarNfePorChave,
  buscarDocumentosPorNsu,
} = require("../services/nfeDistribuicaoService");



function toNumber(valor) {
  return Number(valor || 0);
}

function normalizarUnidadeNota(unidade) {
  const valor = String(unidade || "")
    .trim()
    .toUpperCase();

  if (valor.startsWith("KG")) return "kg";
  if (valor === "G" || valor.startsWith("GR")) return "g";

  if (
    valor === "L" ||
    valor.startsWith("LT") ||
    valor.startsWith("LIT")
  ) {
    return "litro";
  }

  if (valor.startsWith("ML")) return "ml";
  if (valor.startsWith("PCT")) return "pacote";
  if (valor.startsWith("CX")) return "caixa";

  return "unidade";
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

    const notaDuplicada = await NotaFiscalEntrada.findOne({
  $or: [
    chaveAcesso ? { chaveAcesso } : null,
    { numero, serie: serie || "" },
  ].filter(Boolean),
});

if (notaDuplicada) {
  return res.status(400).json({
    success: false,
    message: "Esta nota fiscal já foi lançada no sistema. Entrada bloqueada para evitar duplicidade.",
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
      const quantidade = toNumber(item.quantidade);
      const valorUnitario = toNumber(item.valorUnitario);
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

      const itemCalculado = {
  nome: item.nome || materia?.nome || "Item da nota",
  codigo: item.codigo || "",
  unidade: item.unidade || materia?.unidade || "unidade",
  quantidade,
  valorUnitario,
  valorTotal,
};

if (materia?._id) {
  itemCalculado.materiaPrima = materia._id;
}

itensCalculados.push(itemCalculado);

      if (materia) {
        materia.estoqueAtual = toNumber(materia.estoqueAtual) + quantidade;
        materia.custoUnitario = valorUnitario;
        await materia.save();
      }
    }

    const totalNota =
      toNumber(valorProdutos) + toNumber(valorFrete) - toNumber(valorDesconto);

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
      valorFrete: toNumber(valorFrete),
      valorDesconto: toNumber(valorDesconto),
      valorTotal: Number(totalNota.toFixed(2)),
      formaPagamento: formaPagamento || "PIX",
      status: "entrada_realizada",
      itens: itensCalculados,
      xmlImportado: false,
      observacao: observacao || "",
    });

    await ContaPagar.create({
      descricao: `NF Entrada ${numero}${serie ? "/" + serie : ""}`,
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
  origem: "compra",
  descricao: `NF Entrada ${numero}${serie ? "/" + serie : ""}`,
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

exports.buscarNfePelaChave = async (
  req,
  res
) => {
  try {
    const chave =
      String(
        req.body?.chave || ""
      ).replace(/\D/g, "");

    if (chave.length !== 44) {
      return res.status(400).json({
        success: false,
        message:
          "Informe uma chave de acesso válida com 44 dígitos.",
      });
    }

    const resultado =
      await buscarNfePorChave(
        chave
      );

    if (
      !resultado.encontrouXml
    ) {
      return res.json({
        success: true,

        encontrouXml: false,

        encontrouResumo:
          resultado.encontrouResumo,

        cStat:
          resultado.cStat,

        xMotivo:
          resultado.xMotivo,

        resumoXml:
          resultado.resumoXml || "",

        message:
          resultado.encontrouResumo
            ? "A NF-e foi localizada, mas o XML completo ainda não está disponível."
            : resultado.xMotivo ||
              "A NF-e não foi disponibilizada para download.",
      });
    }

    return res.json({
      success: true,

      encontrouXml: true,

      xml:
        resultado.xml,

      cStat:
        resultado.cStat,

      xMotivo:
        resultado.xMotivo,

      message:
        "XML da NF-e localizado com sucesso.",
    });
  } catch (error) {
    console.log(
      "ERRO BUSCAR NF-E PELA CHAVE:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Erro ao consultar NF-e.",
    });
  }
};

exports.buscarNfesRecebidas = async (
  req,
  res
) => {
  try {
    const resultado =
      await buscarDocumentosPorNsu();

    return res.json({
      success: true,

      cStat:
        resultado.cStat,

      xMotivo:
        resultado.xMotivo,

      ultNSU:
        resultado.ultNSU,

      maxNSU:
        resultado.maxNSU,

      documentos:
        resultado.documentos,

      message:
        resultado.xMotivo ||
        "Consulta realizada com sucesso.",
    });
  } catch (error) {
    console.log(
      "ERRO BUSCAR NF-E RECEBIDAS:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Erro ao consultar NF-e recebidas.",
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

    if (nota.status === "cancelada") {
      return res.status(400).json({
        success: false,
        message: "Esta nota já está cancelada.",
      });
    }

    for (const item of nota.itens || []) {
      if (item.materiaPrima) {
        const materia = await MateriaPrima.findById(item.materiaPrima);

        if (materia) {
          materia.estoqueAtual = toNumber(materia.estoqueAtual) - toNumber(item.quantidade);

          if (materia.estoqueAtual < 0) {
            materia.estoqueAtual = 0;
          }

          await materia.save();
        }
      }
    }

    await ContaPagar.updateMany(
      {
        descricao: `NF Entrada ${nota.numero}${nota.serie ? "/" + nota.serie : ""}`,
      },
      {
        status: "cancelada",
        observacao: "Cancelada automaticamente pelo cancelamento da nota fiscal.",
      }
    );

    await MovimentacaoFinanceira.updateMany(
      {
        descricao: `NF Entrada ${nota.numero}${nota.serie ? "/" + nota.serie : ""}`,
      },
      {
        observacao: "Movimentação referente a nota fiscal cancelada.",
      }
    );

    nota.status = "cancelada";
    nota.observacao = `${nota.observacao || ""} | Nota cancelada no sistema.`;

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
      .reduce((acc, nota) => acc + toNumber(nota.valorTotal), 0);

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

exports.processarNotaNoEstoque = async (req, res) => {
  try {
    const nota = await NotaFiscalEntrada.findById(req.params.id);

    if (!nota) {
      return res.status(404).json({
        success: false,
        message: "Nota fiscal não encontrada.",
      });
    }

    if (nota.status === "cancelada") {
      return res.status(400).json({
        success: false,
        message: "Nota fiscal cancelada não pode gerar entrada de estoque.",
      });
    }

    if (nota.estoqueProcessado) {
      return res.status(400).json({
        success: false,
        message: "O estoque desta nota já foi processado.",
      });
    }

    // ============================
    // FORNECEDOR
    // ============================

    const documento = String(
      nota.fornecedorDocumento || ""
    ).replace(/\D/g, "");

    let fornecedor = null;

    if (nota.fornecedor) {
      fornecedor = await Fornecedor.findById(
        nota.fornecedor
      );
    }

    if (!fornecedor && documento) {
      fornecedor = await Fornecedor.findOne({
        documento,
      });
    }

    if (!fornecedor) {
      fornecedor = await Fornecedor.create({
        nome:
          nota.fornecedorNome ||
          "Fornecedor NF-e",

        documento,

        categoria: "Fornecedor NF-e",

        observacao:
          `Criado automaticamente pela NF-e ${nota.numero}.`,
      });
    }

    // ============================
    // ITENS / ESTOQUE
    // ============================

    const itensCompra = [];

    for (const item of nota.itens) {
      let materia = null;

      if (item.materiaPrima) {
        materia = await MateriaPrima.findById(
          item.materiaPrima
        );
      }

      // Primeiro tenta localizar pelo nome exato.
      if (!materia && item.nome) {
        materia = await MateriaPrima.findOne({
          nome: {
            $regex: `^${String(item.nome)
              .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i",
          },
        });
      }

      const unidade =
        normalizarUnidadeNota(item.unidade);

      // Não encontrou: cria automaticamente.
      if (!materia) {
        materia = await MateriaPrima.create({
          nome: item.nome || "Item NF-e",

          codigo: item.codigo || "",

          categoria: "Insumos",

          tipoItem: "materia_prima",

          unidade,

          estoqueAtual: 0,

          custoUnitario:
            toNumber(item.valorUnitario),

          ultimoCusto:
            toNumber(item.valorUnitario),

          fornecedor:
            fornecedor.nome,

          fornecedorPrincipal:
            fornecedor._id,

          observacoes:
            `Criado automaticamente pela NF-e ${nota.numero}.`,
        });
      }

      const quantidade =
        toNumber(item.quantidade);

      const custoUnitario =
        toNumber(item.valorUnitario);

      const saldoAnterior =
        toNumber(materia.estoqueAtual);

      const saldoPosterior =
        saldoAnterior + quantidade;

      materia.estoqueAtual =
        saldoPosterior;

      materia.ultimoCusto =
        custoUnitario;

      materia.custoUnitario =
        custoUnitario;

      materia.fornecedorPrincipal =
        fornecedor._id;

      materia.fornecedor =
        fornecedor.nome;

      materia.movimentacoes =
        materia.movimentacoes || [];

      materia.movimentacoes.push({
        tipo: "entrada",

        quantidade,

        saldoAnterior,

        saldoPosterior,

        custoUnitario,

        motivo: "Entrada por NF-e",

        documento:
          `NF-e ${nota.numero}${
            nota.serie
              ? "/" + nota.serie
              : ""
          }`,

        fornecedor: fornecedor.nome,

        realizadoPor: "Sistema",
      });

      await materia.save();

      item.materiaPrima =
        materia._id;

      itensCompra.push({
        materiaPrima:
          materia._id,

        nome:
          materia.nome,

        quantidade,

        unidade:
          materia.unidade,

        custoUnitario,

        total:
          quantidade * custoUnitario,
      });
    }

    // ============================
    // REGISTRO EM COMPRAS
    // ============================

    const compra = await Compra.create({
      fornecedor:
        fornecedor._id,

      fornecedorNome:
        fornecedor.nome,

      itens:
        itensCompra,

      valorTotal:
        toNumber(nota.valorTotal),

      formaPagamento:
        nota.formaPagamento || "PIX",

      status:
        "recebida",

      dataCompra:
        nota.dataEmissao || nota.dataEntrada || new Date(),

      observacao:
        `Gerada automaticamente pela NF-e ${nota.numero}.`,
    });

    // Não cria ContaPagar nem MovimentacaoFinanceira aqui.
    // A entrada fiscal já executou o financeiro.

    nota.fornecedor =
      fornecedor._id;

    nota.fornecedorNome =
      fornecedor.nome;

    nota.estoqueProcessado =
      true;

    nota.compraGerada =
      compra._id;

    await nota.save();

    return res.json({
      success: true,

      message:
        `${itensCompra.length} itens processados. ` +
        "Fornecedor, estoque e compra atualizados.",

      fornecedor,

      compra,
    });
  } catch (error) {
    console.log(
      "ERRO PROCESSAR NF-E NO ESTOQUE:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.excluirNotaEntrada = async (req, res) => {
  try {
    const nota = await NotaFiscalEntrada.findById(req.params.id);

    if (!nota) {
      return res.status(404).json({
        success: false,
        message: "Nota fiscal não encontrada.",
      });
    }

    await NotaFiscalEntrada.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Nota fiscal excluída com sucesso.",
    });
  } catch (error) {
    console.log("ERRO EXCLUIR NOTA ENTRADA:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};