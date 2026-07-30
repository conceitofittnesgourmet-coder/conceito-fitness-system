const Empresa = require("../models/empresa");

function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

function somenteNumeros(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function prepararPayload(body = {}, empresaAtual = null) {
  const enderecoFiscal = body.enderecoFiscal || {};
  const dadosComerciais = body.dadosComerciais || {};

  const payload = {
    nomeFantasia: texto(body.nomeFantasia) || "Conceito Fitness Gourmet",
    razaoSocial: texto(body.razaoSocial),
    cnpj: somenteNumeros(body.cnpj),
    inscricaoEstadual: somenteNumeros(body.inscricaoEstadual),
    inscricaoMunicipal: texto(body.inscricaoMunicipal),
    cnae: texto(body.cnae),
    crt: Number(body.crt || 1),
    email: texto(body.email).toLowerCase(),
    telefone: texto(body.telefone),
    whatsapp: texto(body.whatsapp),
    instagram: texto(body.instagram),
    logo: texto(body.logo),
    mensagemCupom: texto(body.mensagemCupom) || empresaAtual?.mensagemCupom,
    taxaEntregaPadrao: Number(body.taxaEntregaPadrao || 0),
    ativa: body.ativa !== false,
    enderecoFiscal: {
      cep: somenteNumeros(enderecoFiscal.cep),
      logradouro: texto(enderecoFiscal.logradouro),
      numero: texto(enderecoFiscal.numero),
      complemento: texto(enderecoFiscal.complemento),
      bairro: texto(enderecoFiscal.bairro),
      cidade: texto(enderecoFiscal.cidade),
      codigoMunicipioIbge: somenteNumeros(enderecoFiscal.codigoMunicipioIbge),
      uf: texto(enderecoFiscal.uf).toUpperCase().slice(0, 2),
      codigoPais: somenteNumeros(enderecoFiscal.codigoPais) || "1058",
      pais: texto(enderecoFiscal.pais) || "Brasil",
    },
    dadosComerciais: {
      site: texto(dadosComerciais.site),
      chavePix: texto(dadosComerciais.chavePix),
      horarioAtendimento: texto(dadosComerciais.horarioAtendimento),
      observacoes: texto(dadosComerciais.observacoes),
    },
  };

  // Mantém os campos antigos sincronizados, sem quebrar módulos legados.
  payload.endereco = [payload.enderecoFiscal.logradouro, payload.enderecoFiscal.numero]
    .filter(Boolean)
    .join(", ");
  payload.cidade = payload.enderecoFiscal.cidade;
  payload.estado = payload.enderecoFiscal.uf;
  payload.cep = payload.enderecoFiscal.cep;

  return payload;
}

function validar(payload) {
  const erros = [];
  if (!payload.nomeFantasia) erros.push("Informe o nome fantasia.");
  if (payload.cnpj && payload.cnpj.length !== 14) erros.push("O CNPJ deve possuir 14 dígitos.");
  if (![1, 2, 3, 4].includes(payload.crt)) erros.push("Selecione um CRT válido.");
  if (payload.enderecoFiscal.cep && payload.enderecoFiscal.cep.length !== 8) {
    erros.push("O CEP deve possuir 8 dígitos.");
  }
  if (
    payload.enderecoFiscal.codigoMunicipioIbge &&
    payload.enderecoFiscal.codigoMunicipioIbge.length !== 7
  ) {
    erros.push("O código IBGE do município deve possuir 7 dígitos.");
  }
  return erros;
}

exports.buscarEmpresa = async (req, res) => {
  try {
    let empresa = await Empresa.findOne();
    if (!empresa) empresa = await Empresa.create({ nomeFantasia: "Conceito Fitness Gourmet" });
    return res.json({ success: true, empresa });
  } catch (error) {
    console.log("ERRO BUSCAR EMPRESA:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.salvarEmpresa = async (req, res) => {
  try {
    let empresa = await Empresa.findOne();
    const payload = prepararPayload(req.body, empresa);
    const erros = validar(payload);

    if (erros.length) {
      return res.status(400).json({ success: false, message: erros[0], erros });
    }

    if (!empresa) {
      empresa = await Empresa.create(payload);
    } else {
      empresa = await Empresa.findByIdAndUpdate(empresa._id, { $set: payload }, {
        new: true,
        runValidators: true,
      });
    }

    return res.json({ success: true, message: "Dados da empresa salvos com sucesso.", empresa });
  } catch (error) {
    console.log("ERRO SALVAR EMPRESA:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
