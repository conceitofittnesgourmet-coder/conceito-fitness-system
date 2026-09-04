const mongoose = require("mongoose");
const NotaFiscalEntrada = require("../models/notafiscalentrada");
const Fornecedor = require("../models/fornecedor");
const MateriaPrima = require("../models/materiaprima");
const Compra = require("../models/compra");
const ContaPagar = require("../models/contapagar");
const MovimentacaoFinanceira = require("../models/movimentacaofinanceira");
const NfeRecebida = require("../models/nferecebida");
const Empresa = require("../models/empresa");
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
      valorSeguro,
      valorOutrasDespesas,
      valorICMS,
      valorICMSST,
      valorFCP,
      valorFCPST,
      valorIPI,
      valorTotal,
      formaPagamento,
      observacao,
      itens,
      parcelas,
      vencimentoPagamento,
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

      const fatorConversao =
  item.fatorConversao !== undefined &&
  item.fatorConversao !== null &&
  item.fatorConversao !== ""
    ? toNumber(item.fatorConversao)
    : null;

const quantidadeEstoque =
  item.quantidadeEstoque !== undefined &&
  item.quantidadeEstoque !== null &&
  item.quantidadeEstoque !== ""
    ? toNumber(item.quantidadeEstoque)
    : null;

const unidadeEstoque =
  String(
    item.unidadeEstoque ||
    materia?.unidade ||
    ""
  ).trim();

const itemCalculado = {
  nome: item.nome || materia?.nome || "Item da nota",
  codigo: item.codigo || "",

  ncmOrigem: String(
    item.ncmOrigem || ""
  ).trim(),

  cestOrigem: String(
    item.cestOrigem || ""
  ).trim(),

  cfopOrigem: String(
    item.cfopOrigem || ""
  ).trim(),

  unidade: item.unidade || "unidade",
  quantidade,
  valorUnitario,
  valorTotal,
  fatorConversao,
  quantidadeEstoque,
  unidadeEstoque,
};

if (materia?._id) {
  itemCalculado.materiaPrima = materia._id;
}

itensCalculados.push(itemCalculado);
     
    }

    const valorTotalInformado = toNumber(valorTotal);

const totalNota =
  valorTotalInformado > 0
    ? valorTotalInformado
    : toNumber(valorProdutos) +
      toNumber(valorFrete) -
      toNumber(valorDesconto);

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
      valorSeguro: toNumber(valorSeguro),
      valorOutrasDespesas: toNumber(valorOutrasDespesas),
      valorICMS: toNumber(valorICMS),
      valorICMSST: toNumber(valorICMSST),
      valorFCP: toNumber(valorFCP),
      valorFCPST: toNumber(valorFCPST),
      valorIPI: toNumber(valorIPI),
      valorTotal: Number(totalNota.toFixed(2)),
      formaPagamento: formaPagamento || "PIX",
      status: "rascunho",
      itens: itensCalculados,
      xmlImportado: false,
      estoqueProcessado: false,
      vencimentoPagamento:
      vencimentoPagamento
      ? new Date(vencimentoPagamento)
      : null,
      observacao: observacao || "",
      parcelas:
  Array.isArray(parcelas)
    ? parcelas.map((parcela) => ({
        numero:
          parcela.numero || "",

        vencimento:
          parcela.vencimento
            ? new Date(
                parcela.vencimento
              )
            : null,
            
        valor:
          toNumber(
            parcela.valor
          ),
      }))
    : [],
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


exports.importarNfeRecebida = async (req, res) => {
  let session = null;

  try {
    const id =
      String(
        req.params.id || ""
      ).trim();

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Identificador da NF-e recebida inválido.",
      });
    }

    const empresaAtiva =
      await Empresa.findOne({
        ativa: true,
      }).select("_id cnpj nomeFantasia razaoSocial");

    if (!empresaAtiva) {
      return res.status(500).json({
        success: false,
        message:
          "Nenhuma empresa ativa foi encontrada para processar a NF-e recebida.",
      });
    }

    const nfeRecebida =
      await NfeRecebida.findOne({
        _id: id,
        empresa: empresaAtiva._id,
      });

    if (!nfeRecebida) {
      return res.status(404).json({
        success: false,
        message:
          "NF-e recebida não encontrada para a empresa ativa.",
      });
    }

    if (
      !nfeRecebida.xmlCompleto ||
      String(
        nfeRecebida.xmlCompleto
      ).trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "O XML completo desta NF-e ainda não está disponível.",
      });
    }

    if (
      nfeRecebida.importada &&
      nfeRecebida.notaEntrada
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Esta NF-e recebida já foi importada.",
        notaEntrada:
          nfeRecebida.notaEntrada,
      });
    }

    const parser =
      new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
        trim: true,
      });

    const resultado =
      await parser.parseStringPromise(
        nfeRecebida.xmlCompleto
      );

    const nfe =
      resultado?.nfeProc?.NFe?.infNFe ||
      resultado?.NFe?.infNFe;

    if (!nfe) {
      return res.status(400).json({
        success: false,
        message:
          "XML completo inválido ou estrutura de NF-e não reconhecida.",
      });
    }

    const ide = nfe.ide || {};
    const emit = nfe.emit || {};
    const dest = nfe.dest || {};
    const total =
      nfe.total?.ICMSTot || {};
    const cobr = nfe.cobr || {};
    const pag = nfe.pag || {};

    const cnpjEmpresa =
      String(
        empresaAtiva.cnpj || ""
      ).replace(/\D/g, "");

    const documentoDestinatario =
      String(
        dest.CNPJ ||
        dest.CPF ||
        ""
      ).replace(/\D/g, "");

    if (
      !cnpjEmpresa ||
      cnpjEmpresa.length !== 14
    ) {
      return res.status(500).json({
        success: false,
        message:
          "O CNPJ da empresa ativa não está configurado corretamente.",
      });
    }

    if (
      documentoDestinatario !==
      cnpjEmpresa
    ) {
      return res.status(400).json({
        success: false,
        message:
          "O destinatário informado no XML não corresponde à empresa ativa.",
      });
    }

    const chaveXml =
      String(
        nfe.Id || ""
      )
        .replace(/^NFe/, "")
        .replace(/\D/g, "");

    const protocolo =
      resultado?.nfeProc?.protNFe?.infProt ||
      {};

    const chaveProtocolo =
      String(
        protocolo.chNFe || ""
      ).replace(/\D/g, "");

    const chaveArmazenada =
      String(
        nfeRecebida.chaveAcesso || ""
      ).replace(/\D/g, "");

    const modelo =
      String(
        ide.mod || ""
      ).trim();

    const cStatProtocolo =
      String(
        protocolo.cStat || ""
      ).trim();

    if (
      chaveXml.length !== 44 ||
      chaveProtocolo.length !== 44 ||
      chaveArmazenada.length !== 44
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A chave de acesso da NF-e está ausente ou inválida no XML, protocolo ou registro recebido.",
      });
    }

    if (
      chaveXml !== chaveProtocolo ||
      chaveXml !== chaveArmazenada
    ) {
      return res.status(400).json({
        success: false,
        message:
          "As chaves da NF-e não coincidem entre XML, protocolo de autorização e documento recebido.",
      });
    }

    if (modelo !== "55") {
      return res.status(400).json({
        success: false,
        message:
          "O documento recebido não é uma NF-e modelo 55.",
      });
    }

    if (cStatProtocolo !== "100") {
      return res.status(400).json({
        success: false,
        message:
          "A NF-e não possui protocolo de autorização válido com cStat 100.",
      });
    }

    const chaveAcesso =
      chaveXml;

    const notaExistente =
      await NotaFiscalEntrada.findOne({
        chaveAcesso,
      });

    if (notaExistente) {
      return res.status(409).json({
        success: false,
        message:
          "Esta NF-e já possui uma nota fiscal de entrada no sistema. O vínculo automático não será realizado.",
        notaEntrada:
          notaExistente._id,
      });
    }

    const detRaw = nfe.det || [];

    const detArray =
      Array.isArray(detRaw)
        ? detRaw
        : [detRaw];

    if (
      detArray.length === 0 ||
      !detArray[0]
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A NF-e não possui itens válidos.",
      });
    }

    const itens =
      detArray.map((det) => {
        const prod =
          det.prod || {};

        const quantidade =
          Number(
            prod.qCom || 0
          );

        const valorUnitario =
          Number(
            prod.vUnCom || 0
          );

        const valorTotal =
          Number(
            prod.vProd || 0
          );

        return {
          materiaPrima: null,

          nome:
            prod.xProd ||
            "Produto da nota",

          codigo:
            prod.cProd || "",

          ncmOrigem:
            String(
              prod.NCM || ""
            ).trim(),

          cestOrigem:
            String(
              prod.CEST || ""
            ).trim(),

          cfopOrigem:
            String(
              prod.CFOP || ""
            ).trim(),

          unidade:
            prod.uCom ||
            "unidade",

          quantidade,
          valorUnitario,
          valorTotal,

          fatorConversao: null,
          quantidadeEstoque: null,
          unidadeEstoque: "",
        };
      });

    const itemInvalido =
      itens.find((item) =>
        !Number.isFinite(item.quantidade) ||
        item.quantidade <= 0 ||
        !Number.isFinite(item.valorUnitario) ||
        item.valorUnitario < 0 ||
        !Number.isFinite(item.valorTotal) ||
        item.valorTotal < 0
      );

    if (itemInvalido) {
      return res.status(400).json({
        success: false,
        message:
          "A NF-e possui item com quantidade ou valores numéricos inválidos.",
      });
    }

    const duplicatasRaw =
      cobr.dup || [];

    const duplicatas =
      Array.isArray(
        duplicatasRaw
      )
        ? duplicatasRaw
        : duplicatasRaw
        ? [duplicatasRaw]
        : [];

    const parcelas =
      duplicatas
        .map((dup) => ({
          numero:
            String(
              dup.nDup || ""
            ).trim(),

          vencimento:
            dup.dVenc
              ? new Date(
                  dup.dVenc
                )
              : null,

          valor:
            Number(
              dup.vDup ?? NaN
            ),
        }));

    const parcelaInvalida =
      parcelas.find((parcela) =>
        !parcela.vencimento ||
        Number.isNaN(
          parcela.vencimento.getTime()
        ) ||
        !Number.isFinite(
          parcela.valor
        ) ||
        parcela.valor <= 0
      );

    if (parcelaInvalida) {
      return res.status(400).json({
        success: false,
        message:
          "A NF-e possui duplicata com vencimento ou valor inválido.",
      });
    }

    const pagamentosRaw =
      pag.detPag || [];

    const pagamentos =
      Array.isArray(
        pagamentosRaw
      )
        ? pagamentosRaw
        : pagamentosRaw
        ? [pagamentosRaw]
        : [];

    const formas = {
      "01": "DINHEIRO",
      "03": "CREDITO",
      "04": "DEBITO",
      "15": "BOLETO",
      "17": "PIX",
      "90": "SEM_PAGAMENTO",
      "99": "OUTROS",
    };

    let formaPagamento =
      pagamentos.length > 0
        ? formas[
            String(
              pagamentos[0]
                ?.tPag || ""
            )
          ] || "OUTROS"
        : "OUTROS";

    if (
      parcelas.length > 0
    ) {
      formaPagamento =
        "BOLETO";
    }

    const valorProdutos =
      Number(
        total.vProd ?? NaN
      );

    const valorFrete =
      Number(
        total.vFrete || 0
      );

    const valorDesconto =
      Number(
        total.vDesc || 0
      );

    const valorTotal =
      Number(
        total.vNF ?? NaN
      );

    if (
      !Number.isFinite(valorProdutos) ||
      valorProdutos < 0 ||
      !Number.isFinite(valorFrete) ||
      valorFrete < 0 ||
      !Number.isFinite(valorDesconto) ||
      valorDesconto < 0 ||
      !Number.isFinite(valorTotal) ||
      valorTotal <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A NF-e possui totais numéricos inválidos.",
      });
    }

    if (parcelas.length > 0) {
      const totalParcelasCentavos =
        parcelas.reduce(
          (soma, parcela) =>
            soma +
            Math.round(
              parcela.valor * 100
            ),
          0
        );

      const totalNfeCentavos =
        Math.round(
          valorTotal * 100
        );

      if (
        totalParcelasCentavos !==
        totalNfeCentavos
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A soma das duplicatas não corresponde ao valor total da NF-e.",
        });
      }
    }

    const dataEmissao =
      ide.dhEmi
        ? new Date(
            ide.dhEmi
          )
        : ide.dEmi
        ? new Date(
            ide.dEmi
          )
        : nfeRecebida.dataEmissao ||
          new Date();

    if (
      Number.isNaN(
        dataEmissao.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Data de emissão inválida no XML.",
      });
    }

    session =
      await mongoose.startSession();

    session.startTransaction();

    const recebidaTransacao =
      await NfeRecebida.findOne({
        _id: nfeRecebida._id,
        empresa: empresaAtiva._id,
        importada: false,
      }).session(session);

    if (
      !recebidaTransacao
    ) {
      throw new Error(
        "Esta NF-e foi importada por outro processamento."
      );
    }

    const nota =
      new NotaFiscalEntrada({
        numero:
          String(
            ide.nNF || ""
          ).trim(),

        serie:
          String(
            ide.serie || ""
          ).trim(),

        chaveAcesso,

        fornecedor: null,

        fornecedorNome:
          emit.xNome ||
          nfeRecebida.emitenteNome ||
          "Fornecedor não informado",

        fornecedorDocumento:
          String(
            emit.CNPJ ||
            emit.CPF ||
            nfeRecebida.emitenteDocumento ||
            ""
          ).replace(/\D/g, ""),

        dataEmissao,
        dataEntrada:
          new Date(),

        valorProdutos,

        valorFrete,

        valorDesconto,

        valorTotal,

        formaPagamento,

        status:
          "rascunho",

        itens,

        xmlImportado:
          true,

        estoqueProcessado:
          false,

        vencimentoPagamento:
          parcelas.length === 1 &&
          parcelas[0].vencimento
            ? parcelas[0].vencimento
            : null,

        parcelas,

        observacao:
          "Importada da NF-e recebida pelo Ambiente Nacional. Aguardando conferência e vínculo dos itens ao estoque.",
      });

    await nota.save({
      session,
    });

    const vinculo =
      await NfeRecebida.updateOne(
        {
          _id:
            recebidaTransacao._id,
          empresa:
            empresaAtiva._id,
          importada: false,
        },
        {
          $set: {
            importada: true,
            notaEntrada:
              nota._id,
          },
        },
        {
          session,
        }
      );

    if (
      vinculo.modifiedCount !== 1
    ) {
      throw new Error(
        "Não foi possível vincular a NF-e recebida ao rascunho criado."
      );
    }

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message:
        "NF-e recebida importada como rascunho com sucesso.",
      nota,
    });
  } catch (error) {
    if (
      session &&
      session.inTransaction()
    ) {
      await session.abortTransaction();
    }

    console.log(
      "ERRO IMPORTAR NF-E RECEBIDA:",
      error
    );

    if (
      error?.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Esta NF-e já foi importada ou já existe uma nota de entrada com a mesma chave.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Erro ao importar NF-e recebida.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

exports.cancelarNotaEntrada = async (req, res) => {
  let session = null;

  try {
    let nota = await NotaFiscalEntrada.findById(req.params.id);

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

    if (nota.status === "processando") {
  return res.status(409).json({
    success: false,
    message:
      "Esta nota está sendo processada no estoque e não pode ser cancelada neste momento.",
  });
}

    if (!nota.estoqueProcessado) {
  return res.status(400).json({
    success: false,
    message:
      "Esta nota ainda não teve o estoque processado e não pode gerar estorno de estoque.",
  });
}

    session =
      await mongoose.startSession();

    session.startTransaction();

    const travaCancelamento =
  await NotaFiscalEntrada.findOneAndUpdate(
    {
      _id: nota._id,
      estoqueProcessado: true,
      status: "entrada_realizada",
    },
    {
      $set: {
        status: "cancelando",
      },
    },
    {
      new: true,
      session,
    }
  );

if (!travaCancelamento) {
  throw new Error(
    "Esta nota não pode ser cancelada porque seu estado foi alterado por outro processamento."
  );
}

nota = travaCancelamento;
    
   for (const item of nota.itens || []) {
  if (!item.materiaPrima) {
    throw new Error(
      `Não foi possível cancelar a nota porque o item "${item.nome}" não possui matéria-prima vinculada.`
    );
  }

        const materia = await MateriaPrima.findById(
  item.materiaPrima
).session(session);

        if (!materia) {
  throw new Error(
    `Não foi possível cancelar a nota porque a matéria-prima vinculada ao item "${item.nome}" não foi encontrada.`
  );
}

const quantidadeEstoque =
  toNumber(item.quantidadeEstoque);

if (quantidadeEstoque <= 0) {
  throw new Error(
    `Não foi possível cancelar a nota porque o item "${item.nome}" não possui quantidade de estoque válida.`
  );
}

const estoqueAtual =
  toNumber(materia.estoqueAtual);

if (estoqueAtual < quantidadeEstoque) {
  throw new Error(
    `Não foi possível cancelar a nota porque o estoque atual de "${item.nome}" (${estoqueAtual}) é menor que a quantidade que precisa ser estornada (${quantidadeEstoque}).`
  );
}

materia.estoqueAtual =
  estoqueAtual - quantidadeEstoque;

await materia.save({ session });
        
  }
    

    await ContaPagar.updateMany(
  {
    notaFiscalEntrada: nota._id,
  },
  {
    status: "cancelada",
    observacao:
      "Cancelada automaticamente pelo cancelamento da nota fiscal.",
  },
  {
    session,
  }
);

if (nota.compraGerada) {
  await Compra.findByIdAndUpdate(
    nota.compraGerada,
    {
      status: "cancelada",
      observacao:
        `Compra cancelada automaticamente pela NF-e ${nota.numero}.`,
    },
    {
      session,
    }
  );
}

    await MovimentacaoFinanceira.updateMany(
  {
    notaFiscalEntrada: nota._id,
    status: {
      $ne: "estornada",
    },
  },
  {
    $set: {
      status: "estornada",
      estornadaEm: new Date(),
      motivoEstorno:
        "Cancelamento da nota fiscal de entrada.",
      observacao:
        "Movimentação estornada automaticamente pelo cancelamento da nota fiscal.",
    },
  },
  {
    session,
  }
);

    nota.status = "cancelada";
    nota.observacao = `${nota.observacao || ""} | Nota cancelada no sistema.`;

    await nota.save({ session });

await session.commitTransaction();
await session.endSession();
session = null;

return res.json({
      success: true,
      nota,
    });
  } catch (error) {
  if (session) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    await session.endSession();
    session = null;
  }

  console.log(
    "ERRO CANCELAR NOTA ENTRADA:",
    error
  );

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

    const cobr = nfe.cobr || {};
const pag = nfe.pag || {};

const duplicatasRaw =
  cobr.dup || [];

const duplicatas =
  Array.isArray(duplicatasRaw)
    ? duplicatasRaw
    : duplicatasRaw
    ? [duplicatasRaw]
    : [];

const parcelas = duplicatas
  .map((dup) => ({
    numero: String(
      dup.nDup || ""
    ),

    vencimento:
      dup.dVenc || null,

    valor:
      Number(dup.vDup || 0),
  }))
  .filter(
    (parcela) =>
      parcela.valor > 0
  );

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

  ncmOrigem: String(prod.NCM || "").trim(),
  cestOrigem: String(prod.CEST || "").trim(),
  cfopOrigem: String(prod.CFOP || "").trim(),

  unidade: prod.uCom || "unidade",
  quantidade,
  valorUnitario,
  valorTotal,

  fatorConversao: null,
  quantidadeEstoque: null,
  unidadeEstoque: "",
};
    });

    const pagamentosRaw =
  pag.detPag || [];

const pagamentosXml =
  Array.isArray(pagamentosRaw)
    ? pagamentosRaw
    : pagamentosRaw
    ? [pagamentosRaw]
    : [];

function traduzirPagamentoNfe(codigo) {
  const valor =
    String(codigo || "");

  const formas = {
    "01": "DINHEIRO",
    "03": "CREDITO",
    "04": "DEBITO",
    "15": "BOLETO",
    "17": "PIX",
    "90": "SEM_PAGAMENTO",
    "99": "OUTROS",
  };

  return formas[valor] || "OUTROS";
}

let formaPagamentoXml =
  pagamentosXml.length
    ? traduzirPagamentoNfe(
        pagamentosXml[0]?.tPag
      )
    : "OUTROS";

if (parcelas.length > 0) {
  formaPagamentoXml = "BOLETO";
}

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
      valorSeguro: Number(total.vSeg || 0),
      valorOutrasDespesas: Number(total.vOutro || 0),
      valorICMS: Number(total.vICMS || 0),
      valorICMSST: Number(total.vST || 0),
      valorFCP: Number(total.vFCP || 0),
      valorFCPST: Number(total.vFCPST || 0),
      valorIPI: Number(total.vIPI || 0),
      valorProdutos: Number(total.vProd || 0),
      valorTotal: Number(total.vNF || 0),
      formaPagamento:
  formaPagamentoXml,

parcelas,
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


exports.conferirNotaEntrada = async (req, res) => {
  try {
    const { id } = req.params;
    const { itens } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID da nota de entrada inválido.",
      });
    }

    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Informe os itens para conferência.",
      });
    }

    const nota =
      await NotaFiscalEntrada.findById(id);

    if (!nota) {
      return res.status(404).json({
        success: false,
        message: "Nota fiscal de entrada não encontrada.",
      });
    }

    if (nota.status === "cancelada") {
      return res.status(400).json({
        success: false,
        message: "Nota fiscal cancelada não pode ser conferida.",
      });
    }

    if (nota.estoqueProcessado) {
      return res.status(400).json({
        success: false,
        message:
          "O estoque desta nota já foi processado. A conferência não pode mais ser alterada.",
      });
    }

    const itensPorId =
      new Map(
        nota.itens.map((item) => [
          String(item._id),
          item,
        ])
      );

    for (const itemRecebido of itens) {
      const itemId =
        String(
          itemRecebido?._id ||
          itemRecebido?.id ||
          ""
        );

      if (!itemId || !itensPorId.has(itemId)) {
        return res.status(400).json({
          success: false,
          message:
            "Foi informado um item que não pertence a esta nota.",
        });
      }

      const materiaPrimaId =
        String(
          itemRecebido.materiaPrima ||
          ""
        ).trim();

      if (
        !mongoose.Types.ObjectId.isValid(
          materiaPrimaId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Selecione uma matéria-prima válida para o item "${itensPorId.get(itemId).nome}".`,
        });
      }

      const materia =
        await MateriaPrima.findById(
          materiaPrimaId
        ).select(
          "_id nome unidade"
        );

      if (!materia) {
        return res.status(400).json({
          success: false,
          message:
            `A matéria-prima selecionada para "${itensPorId.get(itemId).nome}" não foi encontrada.`,
        });
      }

      const fatorConversao =
        Number(
          itemRecebido.fatorConversao
        );

      const quantidadeEstoque =
        Number(
          itemRecebido.quantidadeEstoque
        );

      const unidadeEstoque =
        String(
          itemRecebido.unidadeEstoque ||
          ""
        ).trim();

      if (
        !Number.isFinite(fatorConversao) ||
        fatorConversao <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Informe um fator de conversão válido para "${itensPorId.get(itemId).nome}".`,
        });
      }

      if (
        !Number.isFinite(quantidadeEstoque) ||
        quantidadeEstoque <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Informe uma quantidade de estoque válida para "${itensPorId.get(itemId).nome}".`,
        });
      }

      if (!unidadeEstoque) {
        return res.status(400).json({
          success: false,
          message:
            `Informe a unidade de estoque para "${itensPorId.get(itemId).nome}".`,
        });
      }

      if (
        String(materia.unidade || "")
          .trim()
          .toLowerCase() !==
        unidadeEstoque.toLowerCase()
      ) {
        return res.status(400).json({
          success: false,
          message:
            `A unidade de estoque do item "${itensPorId.get(itemId).nome}" precisa ser "${materia.unidade}".`,
        });
      }

      const itemNota =
        itensPorId.get(itemId);

      itemNota.materiaPrima =
        materia._id;

      itemNota.fatorConversao =
        fatorConversao;

      itemNota.quantidadeEstoque =
        quantidadeEstoque;

      itemNota.unidadeEstoque =
        materia.unidade;
    }

    const todosConferidos =
      nota.itens.every(
        (item) =>
          item.materiaPrima &&
          Number(item.fatorConversao) > 0 &&
          Number(item.quantidadeEstoque) > 0 &&
          String(
            item.unidadeEstoque ||
            ""
          ).trim()
      );

    nota.status =
      todosConferidos
        ? "conferida"
        : "rascunho";

    await nota.save();

    const notaAtualizada =
      await NotaFiscalEntrada.findById(
        nota._id
      )
        .populate(
          "fornecedor",
          "nome documento"
        )
        .populate(
          "itens.materiaPrima",
          "nome unidade estoqueAtual custoUnitario"
        );

    return res.status(200).json({
      success: true,
      message: todosConferidos
        ? "Conferência salva. A nota está pronta para processar o estoque."
        : "Conferência parcial salva.",
      nota: notaAtualizada,
    });
  } catch (error) {
    console.error(
      "Erro ao conferir nota de entrada:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Erro ao salvar conferência da nota de entrada.",
    });
  }
};

exports.processarNotaNoEstoque = async (req, res) => {
  let session = null;

  try {
    let nota = await NotaFiscalEntrada.findById(req.params.id);

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
// PRÉ-VALIDAÇÃO DOS ITENS
// Nenhuma alteração de estoque
// deve ocorrer antes desta etapa.
// ============================

if (!Array.isArray(nota.itens) || nota.itens.length === 0) {
  return res.status(400).json({
    success: false,
    message:
      "A nota fiscal não possui itens para processamento.",
  });
}

for (const item of nota.itens) {
  if (!item.materiaPrima) {
    return res.status(400).json({
      success: false,
      message:
        `O item "${item.nome}" ainda não está vinculado a uma matéria-prima. ` +
        "Faça a conferência antes de processar o estoque.",
    });
  }

  const materia = await MateriaPrima.findById(
  item.materiaPrima
);

  if (!materia) {
    return res.status(400).json({
      success: false,
      message:
        `A matéria-prima vinculada ao item "${item.nome}" não foi encontrada.`,
    });
  }

  const fatorConversao =
    toNumber(item.fatorConversao);

  const quantidadeEstoque =
    toNumber(item.quantidadeEstoque);

  if (
    fatorConversao <= 0 ||
    quantidadeEstoque <= 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        `O item "${item.nome}" ainda não possui conversão de estoque válida.`,
    });
  }

  if (!item.unidadeEstoque) {
    return res.status(400).json({
      success: false,
      message:
        `Informe a unidade de estoque do item "${item.nome}".`,
    });
  }

  if (
    String(item.unidadeEstoque).toLowerCase() !==
    String(materia.unidade).toLowerCase()
  ) {
    return res.status(400).json({
      success: false,
      message:
        `A unidade de estoque do item "${item.nome}" não corresponde à unidade cadastrada na matéria-prima.`,
    });
  }

  const valorTotalItem =
    toNumber(item.valorTotal);

  const custoUnitario =
    quantidadeEstoque > 0
      ? valorTotalItem / quantidadeEstoque
      : 0;

  if (custoUnitario <= 0) {
    return res.status(400).json({
      success: false,
      message:
        `Não foi possível calcular o custo unitário de estoque do item "${item.nome}".`,
    });
  }
}

// ============================
// PRÉ-VALIDAÇÃO FINANCEIRA
// Nenhuma movimentação deve ocorrer
// com parcelas inválidas.
// ============================

if (Array.isArray(nota.parcelas) && nota.parcelas.length > 0) {
  let totalParcelasCentavos = 0;

  for (const parcela of nota.parcelas) {
    const valorParcela = toNumber(parcela.valor);

    if (!parcela.vencimento) {
      return res.status(400).json({
        success: false,
        message:
          `A parcela "${parcela.numero || "sem número"}" não possui vencimento válido.`,
      });
    }

    const vencimento = new Date(parcela.vencimento);

    if (Number.isNaN(vencimento.getTime())) {
      return res.status(400).json({
        success: false,
        message:
          `A parcela "${parcela.numero || "sem número"}" possui uma data de vencimento inválida.`,
      });
    }

    if (valorParcela <= 0) {
      return res.status(400).json({
        success: false,
        message:
          `A parcela "${parcela.numero || "sem número"}" possui valor inválido.`,
      });
    }

    totalParcelasCentavos += Math.round(
      valorParcela * 100
    );
  }

  const totalNotaCentavos = Math.round(
    toNumber(nota.valorTotal) * 100
  );

  if (totalParcelasCentavos !== totalNotaCentavos) {
    return res.status(400).json({
      success: false,
      message:
        `A soma das parcelas (${(
          totalParcelasCentavos / 100
        ).toFixed(2)}) não corresponde ao total da nota (${(
          totalNotaCentavos / 100
        ).toFixed(2)}).`,
    });
  }
}

const formaPagamentoNormalizada =
  String(nota.formaPagamento || "")
    .trim()
    .toUpperCase();

const formasAPrazo = [
  "BOLETO",
  "CREDIARIO",
  "A_PRAZO",
  "PRAZO",
];

const possuiParcelas =
  Array.isArray(nota.parcelas) &&
  nota.parcelas.length > 0;

if (
  formasAPrazo.includes(formaPagamentoNormalizada) &&
  !possuiParcelas
) {
  if (!nota.vencimentoPagamento) {
    return res.status(400).json({
      success: false,
      message:
        "A forma de pagamento é a prazo, mas a nota não possui parcelas nem vencimento de pagamento.",
    });
  }

  const vencimentoPagamento =
    new Date(nota.vencimentoPagamento);

  if (Number.isNaN(vencimentoPagamento.getTime())) {
    return res.status(400).json({
      success: false,
      message:
        "A data de vencimento do pagamento da nota é inválida.",
    });
  }
}

session =
  await mongoose.startSession();

session.startTransaction();

const notaTransacao =
  await NotaFiscalEntrada.findById(
    req.params.id
  ).session(session);

if (!notaTransacao) {
  throw new Error(
    "Nota fiscal não encontrada durante o processamento."
  );
}

if (notaTransacao.status === "cancelada") {
  throw new Error(
    "Nota fiscal cancelada não pode gerar entrada de estoque."
  );
}

if (notaTransacao.estoqueProcessado) {
  throw new Error(
    "O estoque desta nota já foi processado."
  );
}

nota = notaTransacao;

const travaProcessamento =
  await NotaFiscalEntrada.updateOne(
    {
  _id: nota._id,
  estoqueProcessado: false,
  status: {
  $in: [
    "rascunho",
    "conferida",
  ],
},
},
    {
      $set: {
        status: "processando",
      },
    },
    {
      session,
    }
  );

if (travaProcessamento.modifiedCount !== 1) {
  throw new Error(
    "Esta nota já está sendo processada ou já foi processada."
  );
}

nota.status = "processando";

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
  ).session(session);
}

    if (!fornecedor && documento) {
      fornecedor = await Fornecedor.findOne({
        documento,
      }).session(session);
    }

    if (!fornecedor) {
  fornecedor = new Fornecedor({
    nome:
      nota.fornecedorNome ||
      "Fornecedor NF-e",

    documento,

    categoria: "Fornecedor NF-e",

    observacao:
      `Criado automaticamente pela NF-e ${nota.numero}.`,
  });

  await fornecedor.save({ session });
}

    // ============================
    // ITENS / ESTOQUE
    // ============================

    const itensCompra = [];

    for (const item of nota.itens) {
  const materia = await MateriaPrima.findById(
    item.materiaPrima
  ).session(session);

  const quantidadeEstoque =
    toNumber(item.quantidadeEstoque);

  const quantidade =
    quantidadeEstoque;

  const valorTotalItem =
    toNumber(item.valorTotal);

  const custoUnitario =
    valorTotalItem / quantidadeEstoque;

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

      await materia.save({ session });

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

    let empresaId =
  req.usuario?.empresa ||
  req.admin?.empresa ||
  null;

if (!empresaId) {
  const empresasAtivas =
    await Empresa.find({
      ativa: true,
    })
      .select("_id")
      .limit(2)
      .session(session);

  if (empresasAtivas.length === 0) {
    throw new Error(
      "Nenhuma empresa ativa foi encontrada para processar a entrada da NF-e."
    );
  }

  if (empresasAtivas.length > 1) {
    throw new Error(
      "Não foi possível determinar com segurança a empresa responsável pela entrada da NF-e."
    );
  }

  empresaId =
    empresasAtivas[0]._id;
}

    const compra = new Compra({
  notaFiscalEntrada: nota._id,

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
    nota.dataEmissao ||
    nota.dataEntrada ||
    new Date(),

  observacao:
    `Gerada automaticamente pela NF-e ${nota.numero}.`,
});

await compra.save({ session });

const formasPagamentoImediato = [
  "DINHEIRO",
  "PIX",
  "DEBITO",
];

const formaPagamentoAtual =
  String(nota.formaPagamento || "")
    .trim()
    .toUpperCase();

if (
  formasPagamentoImediato.includes(
    formaPagamentoAtual
  )
) {
  const movimentacaoExistente =
    await MovimentacaoFinanceira.findOne({
      notaFiscalEntrada: nota._id,
      compra: compra._id,
      tipo: "saida",
      origem: "compra",
    }).session(session);

  if (!movimentacaoExistente) {
    const movimentacao =
      new MovimentacaoFinanceira({
        tipo: "saida",
        origem: "compra",
        descricao:
          `NF Entrada ${nota.numero}${nota.serie ? "/" + nota.serie : ""}`,
        categoria: "Compras",
        valor: toNumber(nota.valorTotal),
        formaPagamento:
          nota.formaPagamento || "",
        notaFiscalEntrada: nota._id,
        compra: compra._id,
        empresa: empresaId,
        observacao:
          `Saída automática gerada pela NF-e ${nota.numero}.`,
      });

    await movimentacao.save({ session });
  }
}

        // ============================
    // CONTAS A PAGAR
    // ============================
  
const contasExistentes = await ContaPagar.countDocuments({
  notaFiscalEntrada: nota._id,
}).session(session);

if (contasExistentes === 0) {
  const descricaoBase =
        `NF Entrada ${nota.numero}${nota.serie ? "/" + nota.serie : ""}`;

      if (Array.isArray(nota.parcelas) && nota.parcelas.length > 0) {
        for (const parcela of nota.parcelas) {
      const conta = new ContaPagar({
  notaFiscalEntrada: nota._id,
  parcelaNumero: parcela.numero || "",
  descricao: descricaoBase,
  categoria: "Compras",
  fornecedor: fornecedor.nome,
  valor: toNumber(parcela.valor),
  vencimento: parcela.vencimento,
  status: "pendente",
  formaPagamento: nota.formaPagamento || "",
  empresa: empresaId,
  observacao:
    `Gerada automaticamente pela NF-e ${nota.numero}.`,
});

await conta.save({ session });
        }
      } else {
        const forma =
          String(nota.formaPagamento || "").toUpperCase();

        const formasAPrazo = [
          "BOLETO",
          "CREDIARIO",
          "A_PRAZO",
          "PRAZO",
        ];

        const ehAPrazo =
          formasAPrazo.includes(forma);

        if (ehAPrazo && nota.vencimentoPagamento) {
          const conta = new ContaPagar({
  notaFiscalEntrada: nota._id,
  descricao: descricaoBase,
  categoria: "Compras",
  fornecedor: fornecedor.nome,
  valor: toNumber(nota.valorTotal),
  vencimento: nota.vencimentoPagamento,
  status: "pendente",
  formaPagamento: nota.formaPagamento || "",
  empresa: empresaId,
  observacao:
    `Gerada automaticamente pela NF-e ${nota.numero}.`,
});

await conta.save({ session });
        }
      }
    }

    nota.fornecedor =
      fornecedor._id;

    nota.fornecedorNome =
      fornecedor.nome;

    nota.estoqueProcessado = true;
nota.status = "entrada_realizada";
nota.compraGerada = compra._id;

    await nota.save({ session });

await session.commitTransaction();
await session.endSession();

return res.json({
      success: true,

      message:
        `${itensCompra.length} itens processados. ` +
        "Fornecedor, estoque e compra atualizados.",

      fornecedor,

      compra,
    });
  } catch (error) {
    if (session) {
  if (session.inTransaction()) {
    await session.abortTransaction();
  }

  await session.endSession();
}

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
    let nota = await NotaFiscalEntrada.findById(req.params.id);

    if (!nota) {
  return res.status(404).json({
    success: false,
    message: "Nota fiscal não encontrada.",
  });
}

    if (
  nota.estoqueProcessado ||
  nota.status === "entrada_realizada" ||
  nota.compraGerada
) {
  return res.status(400).json({
    success: false,
    message:
      "Esta nota já gerou movimentações de estoque/compra e não pode ser excluída diretamente. Utilize o cancelamento da entrada.",
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