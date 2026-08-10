const Cliente = require("../models/cliente");

function calcularClube(gasto) {
  if (gasto >= 2000) return "Black";
  if (gasto >= 1000) return "Premium";
  if (gasto >= 500) return "Ouro";
  if (gasto >= 250) return "Prata";
  return "Básico";
}

exports.listarClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      clientes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.criarCliente = async (req, res) => {
  try {
    const {

  tipoPessoa,

  nome,

  razaoSocial,

  nomeFantasia,

  cpf,

  cnpj,

  inscricaoEstadual,

  inscricaoMunicipal,

  indicadorIe,

  telefone,

  whatsapp,

  email,

  endereco,

  observacaoFiscal,

  cidade,

  aniversario,

  clube

} = req.body || {};

    if (tipoPessoa === "juridica") {

  if (

    !razaoSocial ||

    !cnpj ||

    !telefone

  ) {

    return res.status(400).json({

      success: false,

      message:

        "Razão Social, CNPJ e telefone são obrigatórios.",

    });

  }

} else {

  if (

    !nome ||

    !telefone

  ) {

    return res.status(400).json({

      success: false,

      message:

        "Nome e telefone são obrigatórios.",

    });

  }

}

    const clienteExistente = await Cliente.findOne({ telefone });

    if (clienteExistente) {
      return res.status(400).json({
        success: false,
        message: "Já existe cliente com este telefone.",
      });
    }

    const cliente = await Cliente.create({

  tipoPessoa: tipoPessoa || "fisica",

  nome,

  razaoSocial,

  nomeFantasia,

  cpf,

  cnpj,

  inscricaoEstadual,

  inscricaoMunicipal,

  indicadorIe,

  telefone,

  whatsapp: whatsapp || telefone,

  email: email || "",

  endereco: endereco || {},

  observacaoFiscal: observacaoFiscal || "",

  cidade:

    cidade ||

    endereco?.cidade ||

    "",

  aniversario: aniversario || "",

  clube: clube || "Básico",

  origem: "manual",

});

    return res.status(201).json({
      success: true,
      cliente,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.atualizarCliente = async (req, res) => {
  try {
    const dados = { ...req.body };

    if (dados.gasto !== undefined) {
      dados.clube = calcularClube(Number(dados.gasto || 0));
      dados.pontos = Math.floor(Number(dados.gasto || 0));
      dados.cashback = Number(dados.gasto || 0) * 0.03;
    }

    const cliente = await Cliente.findByIdAndUpdate(req.params.id, dados, {
      new: true,
      runValidators: true,
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: "Cliente não encontrado.",
      });
    }

    return res.json({
      success: true,
      cliente,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.buscarClientes = async (req, res) => {

    try {

        const termo = req.query.q || "";

        const clientes = await Cliente.find({
            nome: {
                $regex: termo,
                $options: "i"
            }
        })
        .sort({ nome: 1 })
        .limit(10);

        res.json(clientes);

    } catch (err) {

        res.status(500).json({
            erro: err.message
        });

    }

};

exports.deletarCliente = async (req, res) => {
  try {
    await Cliente.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Cliente removido com sucesso.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

function normalizarTelefone(valor) {
  return String(valor || "").replace(/\D/g, "");
}

exports.acessarCardapio = async (req, res) => {
  try {
    const nome = String(req.body?.nome || "").trim();
    const telefone = normalizarTelefone(req.body?.telefone);
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!nome || telefone.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Informe seu nome e um WhatsApp válido.",
      });
    }

    let cliente = await Cliente.findOne({ telefone });

    if (!cliente) {
      cliente = await Cliente.create({ nome, telefone, whatsapp: telefone, email, origem: "cardapio-online" });
    } else {
      cliente.nome = nome || cliente.nome;
      cliente.email = email || cliente.email;
      cliente.whatsapp = telefone;
      await cliente.save();
    }

    return res.json({ success: true, cliente });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.perfilCardapio = async (req, res) => {
  try {
    const telefone = normalizarTelefone(req.query?.telefone);
    if (telefone.length < 10) {
      return res.status(400).json({ success: false, message: "WhatsApp inválido." });
    }

    const cliente = await Cliente.findOne({ telefone });
    if (!cliente) {
      return res.status(404).json({ success: false, message: "Cliente não encontrado." });
    }

    return res.json({ success: true, cliente });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.atualizarFavoritosCardapio = async (req, res) => {
  try {
    const telefone = normalizarTelefone(req.body?.telefone);
    const favoritos = Array.isArray(req.body?.favoritos)
      ? [...new Set(req.body.favoritos.map(String).filter(Boolean))]
      : [];

    const cliente = await Cliente.findOneAndUpdate(
      { telefone },
      { $set: { favoritosCardapio: favoritos } },
      { new: true }
    );

    if (!cliente) {
      return res.status(404).json({ success: false, message: "Cliente não encontrado." });
    }

    return res.json({ success: true, favoritos: cliente.favoritosCardapio });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
