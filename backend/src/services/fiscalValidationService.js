const { validarCertificadoA1 } = require("./certificadoservice");

const UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT",
  "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO",
  "RR", "SC", "SP", "SE", "TO",
]);

function somenteNumeros(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function texto(valor) {
  return String(valor ?? "").trim();
}

function numero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : NaN;
}

function todosIguais(documento) {
  return /^(\d)\1+$/.test(documento);
}

function validarCpf(cpfInformado) {
  const cpf = somenteNumeros(cpfInformado);
  if (cpf.length !== 11 || todosIguais(cpf)) return false;

  for (let posicao = 9; posicao <= 10; posicao += 1) {
    let soma = 0;
    for (let i = 0; i < posicao; i += 1) {
      soma += Number(cpf[i]) * (posicao + 1 - i);
    }
    let digito = (soma * 10) % 11;
    if (digito === 10) digito = 0;
    if (digito !== Number(cpf[posicao])) return false;
  }

  return true;
}

function validarCnpj(cnpjInformado) {
  const cnpj = somenteNumeros(cnpjInformado);
  if (cnpj.length !== 14 || todosIguais(cnpj)) return false;

  const calcularDigito = (base, pesos) => {
    const soma = base
      .split("")
      .reduce((total, digito, indice) => total + Number(digito) * pesos[indice], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiro = calcularDigito(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = calcularDigito(`${cnpj.slice(0, 12)}${primeiro}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return cnpj.endsWith(`${primeiro}${segundo}`);
}

function obterEnderecoFiscalEmpresa(empresa = {}) {
  return empresa.enderecoFiscal || empresa.endereco || {};
}

function adicionarErro(erros, campo, mensagem, contexto = "") {
  erros.push({ campo, mensagem, contexto });
}

function validarEndereco(endereco, prefixo, erros, { exigirCep = true } = {}) {
  const end = endereco || {};
  const cep = somenteNumeros(end.cep);
  const codigoIbge = somenteNumeros(end.codigoMunicipioIbge || end.codigoIbge);
  const uf = texto(end.uf || end.estado).toUpperCase();

  if (!texto(end.logradouro || end.rua)) adicionarErro(erros, `${prefixo}.logradouro`, "Logradouro não informado.");
  if (!texto(end.numero)) adicionarErro(erros, `${prefixo}.numero`, "Número não informado. Use 'S/N' quando não existir número.");
  if (!texto(end.bairro)) adicionarErro(erros, `${prefixo}.bairro`, "Bairro não informado.");
  if (!texto(end.cidade || end.municipio)) adicionarErro(erros, `${prefixo}.cidade`, "Cidade não informada.");
  if (codigoIbge.length !== 7) adicionarErro(erros, `${prefixo}.codigoMunicipioIbge`, "Código IBGE do município deve possuir 7 dígitos.");
  if (!UFS.has(uf)) adicionarErro(erros, `${prefixo}.uf`, "UF inválida ou não informada.");
  if (exigirCep && cep.length !== 8) adicionarErro(erros, `${prefixo}.cep`, "CEP deve possuir 8 dígitos.");
}

function validarEmpresa(empresa, erros) {
  if (!empresa) {
    adicionarErro(erros, "empresa", "Empresa emissora não encontrada.");
    return;
  }

  const cnpj = somenteNumeros(empresa.cnpj || empresa.documento);
  const ie = somenteNumeros(empresa.inscricaoEstadual || empresa.ie);
  const crt = Number(empresa.crt || empresa.regimeTributarioCodigo);

  if (!texto(empresa.razaoSocial || empresa.nome)) adicionarErro(erros, "empresa.razaoSocial", "Razão social da empresa não informada.");
  if (!validarCnpj(cnpj)) adicionarErro(erros, "empresa.cnpj", "CNPJ da empresa emissora é inválido.");
  if (!ie) adicionarErro(erros, "empresa.inscricaoEstadual", "Inscrição Estadual da empresa não informada.");
  if (![1, 2, 3, 4].includes(crt)) adicionarErro(erros, "empresa.crt", "CRT deve ser 1, 2, 3 ou 4.");

  if (crt === 3) {
    const regimeFederal = texto(empresa.regimeFederal);
    const regimePisCofins = texto(empresa.regimePisCofins);

    const regimesFederaisPermitidos = [
      "lucro_presumido",
      "lucro_real",
      "lucro_arbitrado",
      "outro",
    ];

    const regimesPisCofinsPermitidos = [
      "cumulativo",
      "nao_cumulativo",
      "misto",
      "outro",
    ];

    if (!regimeFederal) {
      adicionarErro(
        erros,
        "empresa.regimeFederal",
        "Regime federal não informado para empresa CRT 3. Informe o enquadramento contábil antes da emissão."
      );
    } else if (!regimesFederaisPermitidos.includes(regimeFederal)) {
      adicionarErro(
        erros,
        "empresa.regimeFederal",
        "Regime federal informado não é reconhecido pelo emissor."
      );
    }

    if (!regimePisCofins) {
      adicionarErro(
        erros,
        "empresa.regimePisCofins",
        "Regime de PIS/COFINS não informado para empresa CRT 3. Confirme a sistemática tributária antes da emissão."
      );
    } else if (!regimesPisCofinsPermitidos.includes(regimePisCofins)) {
      adicionarErro(
        erros,
        "empresa.regimePisCofins",
        "Regime de PIS/COFINS informado não é reconhecido pelo emissor."
      );
    }
  }

  validarEndereco(obterEnderecoFiscalEmpresa(empresa), "empresa.enderecoFiscal", erros);
}

function validarDestinatario(destinatario, erros) {
  const dest = destinatario || {};
  const tipo = texto(dest.tipoPessoa).toLowerCase();
  const cpf = somenteNumeros(dest.cpf);
  const cnpj = somenteNumeros(dest.cnpj);
  const indicadorIe = Number(dest.indicadorIe ?? 9);

  if (!texto(dest.nomeRazaoSocial)) adicionarErro(erros, "destinatario.nomeRazaoSocial", "Nome ou razão social do destinatário não informado.");

  if (tipo === "juridica" || cnpj) {
    if (!validarCnpj(cnpj)) adicionarErro(erros, "destinatario.cnpj", "CNPJ do destinatário é inválido.");
  } else {
    if (!validarCpf(cpf)) adicionarErro(erros, "destinatario.cpf", "CPF do destinatário é inválido. Confira os 11 dígitos e os dígitos verificadores.");
  }

  if (![1, 2, 9].includes(indicadorIe)) {
    adicionarErro(erros, "destinatario.indicadorIe", "Indicador de IE deve ser 1 (contribuinte), 2 (isento) ou 9 (não contribuinte).");
  }

  if (indicadorIe === 1 && !somenteNumeros(dest.inscricaoEstadual)) {
    adicionarErro(erros, "destinatario.inscricaoEstadual", "Inscrição Estadual é obrigatória para destinatário contribuinte de ICMS.");
  }

  validarEndereco(dest.endereco, "destinatario.endereco", erros);
}

function validarContribuicaoPercentual({
  item,
  prefixo,
  contexto,
  erros,
  tributo,
  cst,
  campoBase,
  campoAliquota,
  campoValor,
}) {
  const naoTributados = ["04", "05", "06", "07", "08", "09"];
  const tributadosDiretos = ["01", "02"];

  const base = numero(item?.[campoBase]);
  const aliquota = numero(item?.[campoAliquota]);
  const valor = numero(item?.[campoValor]);

  if (naoTributados.includes(cst)) {
    if (
      (Number.isFinite(base) && Math.abs(base) > 0.000001) ||
      (Number.isFinite(aliquota) && Math.abs(aliquota) > 0.000001) ||
      (Number.isFinite(valor) && Math.abs(valor) > 0.000001)
    ) {
      adicionarErro(
        erros,
        `${prefixo}.${campoValor}`,
        `${tributo}: CST ${cst} é não tributado na implementação atual, mas existem base, alíquota ou valor diferentes de zero.`,
        contexto
      );
    }

    return;
  }

  if (!cst) return;

  if (!Number.isFinite(base) || base < 0) {
    adicionarErro(
      erros,
      `${prefixo}.${campoBase}`,
      `Base de cálculo do ${tributo} inválida.`,
      contexto
    );
  }

  if (!Number.isFinite(aliquota) || aliquota < 0) {
    adicionarErro(
      erros,
      `${prefixo}.${campoAliquota}`,
      `Alíquota do ${tributo} inválida.`,
      contexto
    );
  }

  if (!Number.isFinite(valor) || valor < 0) {
    adicionarErro(
      erros,
      `${prefixo}.${campoValor}`,
      `Valor do ${tributo} inválido.`,
      contexto
    );
  }

  if (
    tributadosDiretos.includes(cst) &&
    (
      !Number.isFinite(base) ||
      base <= 0 ||
      !Number.isFinite(aliquota) ||
      aliquota <= 0
    )
  ) {
    adicionarErro(
      erros,
      `${prefixo}.${campoBase}`,
      `${tributo}: CST ${cst} exige base e alíquota maiores que zero na implementação atual.`,
      contexto
    );

    return;
  }

  if (
    Number.isFinite(base) &&
    Number.isFinite(aliquota) &&
    Number.isFinite(valor) &&
    base >= 0 &&
    aliquota >= 0
  ) {
    const esperado =
      Math.round(
        (base * aliquota / 100) * 100
      ) / 100;

    if (Math.abs(valor - esperado) > 0.01) {
      adicionarErro(
        erros,
        `${prefixo}.${campoValor}`,
        `Valor do ${tributo} incoerente. Pela base e alíquota informadas, o valor esperado é R$ ${esperado.toFixed(2)}.`,
        contexto
      );
    }
  }
}

function validarItens(itens, erros, empresa = {}) {
  if (!Array.isArray(itens) || itens.length === 0) {
    adicionarErro(
      erros,
      "itens",
      "A NF-e precisa possuir pelo menos um item."
    );
    return;
  }

  const crt = Number(
    empresa.crt ||
    empresa.regimeTributarioCodigo
  );

  const usaCsosn = [1, 4].includes(crt);
  const regimeNormal = crt === 3;

  itens.forEach((item, indice) => {
    const numeroItem = indice + 1;

    const contexto =
      `Item ${numeroItem}${
        item?.descricao
          ? ` - ${item.descricao}`
          : ""
      }`;

    const prefixo = `itens.${indice}`;

    const ncm = somenteNumeros(item?.ncm);
    const cfop = somenteNumeros(item?.cfop);
    const cest = somenteNumeros(item?.cest);

    const quantidade =
      numero(item?.quantidadeComercial);

    const valorUnitario =
      numero(item?.valorUnitarioComercial);

    const valorProduto =
      numero(item?.valorProduto);

    if (!texto(item?.descricao)) {
      adicionarErro(
        erros,
        `${prefixo}.descricao`,
        "Descrição do produto não informada.",
        contexto
      );
    }

    if (ncm.length !== 8) {
      adicionarErro(
        erros,
        `${prefixo}.ncm`,
        "NCM deve possuir exatamente 8 dígitos.",
        contexto
      );
    }

    if (cfop.length !== 4) {
      adicionarErro(
        erros,
        `${prefixo}.cfop`,
        "CFOP deve possuir exatamente 4 dígitos.",
        contexto
      );
    }

    if (cest && cest.length !== 7) {
      adicionarErro(
        erros,
        `${prefixo}.cest`,
        "CEST, quando informado, deve possuir 7 dígitos.",
        contexto
      );
    }

    if (!texto(item?.unidadeComercial)) {
      adicionarErro(
        erros,
        `${prefixo}.unidadeComercial`,
        "Unidade comercial não informada.",
        contexto
      );
    }

    if (
      !Number.isFinite(quantidade) ||
      quantidade <= 0
    ) {
      adicionarErro(
        erros,
        `${prefixo}.quantidadeComercial`,
        "Quantidade deve ser maior que zero.",
        contexto
      );
    }

    if (
      !Number.isFinite(valorUnitario) ||
      valorUnitario < 0
    ) {
      adicionarErro(
        erros,
        `${prefixo}.valorUnitarioComercial`,
        "Valor unitário inválido.",
        contexto
      );
    }

    if (
      !Number.isFinite(valorProduto) ||
      valorProduto < 0
    ) {
      adicionarErro(
        erros,
        `${prefixo}.valorProduto`,
        "Valor total do item inválido.",
        contexto
      );
    }

    // ============================
    // ICMS
    // ============================

    const csosn =
      somenteNumeros(item?.csosn);

    const cstIcms =
      somenteNumeros(item?.cstIcms);

    if (usaCsosn) {
      if (!csosn) {
        adicionarErro(
          erros,
          `${prefixo}.csosn`,
          "CSOSN do ICMS é obrigatório para este CRT.",
          contexto
        );
      } else if (csosn !== "102") {
        adicionarErro(
          erros,
          `${prefixo}.csosn`,
          `CSOSN ${csosn} ainda não possui grupo XML implementado no emissor.`,
          contexto
        );
      }
    }

    if (regimeNormal) {
      if (!cstIcms) {
        adicionarErro(
          erros,
          `${prefixo}.cstIcms`,
          "CST do ICMS é obrigatório para empresa no Regime Normal (CRT 3).",
          contexto
        );
      } else if (cstIcms !== "00") {
        adicionarErro(
          erros,
          `${prefixo}.cstIcms`,
          `CST ICMS ${cstIcms} ainda não possui grupo XML implementado no emissor.`,
          contexto
        );
      }

      if (cstIcms === "00") {
        const base =
          numero(item?.baseCalculoIcms);

        const aliquota =
          numero(item?.aliquotaIcms);

        const valor =
          numero(item?.valorIcms);

        if (
          !Number.isFinite(base) ||
          base <= 0
        ) {
          adicionarErro(
            erros,
            `${prefixo}.baseCalculoIcms`,
            "Base de cálculo do ICMS deve ser maior que zero para CST 00.",
            contexto
          );
        }

        if (
          !Number.isFinite(aliquota) ||
          aliquota <= 0
        ) {
          adicionarErro(
            erros,
            `${prefixo}.aliquotaIcms`,
            "Alíquota do ICMS deve ser maior que zero para CST 00.",
            contexto
          );
        }

        if (
          !Number.isFinite(valor) ||
          valor < 0
        ) {
          adicionarErro(
            erros,
            `${prefixo}.valorIcms`,
            "Valor do ICMS inválido.",
            contexto
          );
        }

        if (
          Number.isFinite(base) &&
          Number.isFinite(aliquota) &&
          Number.isFinite(valor) &&
          base > 0 &&
          aliquota > 0
        ) {
          const esperado =
            Math.round(
              (base * aliquota / 100) * 100
            ) / 100;

          if (
            Math.abs(valor - esperado) > 0.01
          ) {
            adicionarErro(
              erros,
              `${prefixo}.valorIcms`,
              `Valor do ICMS incoerente. Pela base e alíquota informadas, o valor esperado é R$ ${esperado.toFixed(2)}.`,
              contexto
            );
          }
        }
      }
    }

    // ============================
    // PIS
    // ============================

    const cstPis =
      somenteNumeros(item?.cstPis);

    if (!cstPis) {
      adicionarErro(
        erros,
        `${prefixo}.cstPis`,
        "CST do PIS não informado.",
        contexto
      );
    }

    if (
      cstPis &&
      ![
        "01", "02",
        "04", "05", "06", "07", "08", "09",
        "49", "50", "51", "52", "53", "54",
        "55", "56", "60", "61", "62", "63",
        "64", "65", "66", "67", "70", "71",
        "72", "73", "74", "75", "98", "99"
      ].includes(cstPis)
    ) {
      adicionarErro(
        erros,
        `${prefixo}.cstPis`,
        `CST PIS ${cstPis} não é suportado pela implementação atual.`,
        contexto
      );
    }

    validarContribuicaoPercentual({
      item,
      prefixo,
      contexto,
      erros,
      tributo: "PIS",
      cst: cstPis,
      campoBase: "baseCalculoPis",
      campoAliquota: "aliquotaPis",
      campoValor: "valorPis",
    });

    // ============================
    // COFINS
    // ============================

    const cstCofins =
      somenteNumeros(item?.cstCofins);

    if (!cstCofins) {
      adicionarErro(
        erros,
        `${prefixo}.cstCofins`,
        "CST da COFINS não informado.",
        contexto
      );
    }

    if (
      cstCofins &&
      ![
        "01", "02",
        "04", "05", "06", "07", "08", "09",
        "49", "50", "51", "52", "53", "54",
        "55", "56", "60", "61", "62", "63",
        "64", "65", "66", "67", "70", "71",
        "72", "73", "74", "75", "98", "99"
      ].includes(cstCofins)
    ) {
      adicionarErro(
        erros,
        `${prefixo}.cstCofins`,
        `CST COFINS ${cstCofins} não é suportado pela implementação atual.`,
        contexto
      );
    }

    validarContribuicaoPercentual({
      item,
      prefixo,
      contexto,
      erros,
      tributo: "COFINS",
      cst: cstCofins,
      campoBase: "baseCalculoCofins",
      campoAliquota: "aliquotaCofins",
      campoValor: "valorCofins",
    });

    // ============================
    // IBS / CBS
    // ============================

    // Regra atualmente implementada pelo ERP para 2026:
    // CRT 1/4 nao exige IBS/CBS neste fluxo.
    // CRT 3 mantem validacao da estrutura RTC implementada.
    if (regimeNormal) {
      const cstIbsCbs =
        somenteNumeros(item?.cstIbsCbs);

      const cClassTrib =
        somenteNumeros(item?.cClassTrib);

      if (!cstIbsCbs) {
        adicionarErro(
          erros,
          `${prefixo}.cstIbsCbs`,
          "CST IBS/CBS não informado.",
          contexto
        );
      }

      if (!cClassTrib) {
        adicionarErro(
          erros,
          `${prefixo}.cClassTrib`,
          "cClassTrib IBS/CBS não informado.",
          contexto
        );
      }

      if (
        cstIbsCbs &&
        cstIbsCbs.length !== 3
      ) {
        adicionarErro(
          erros,
          `${prefixo}.cstIbsCbs`,
          "CST IBS/CBS deve possuir 3 dígitos.",
          contexto
        );
      }

      if (
        cClassTrib &&
        cClassTrib.length !== 6
      ) {
        adicionarErro(
          erros,
          `${prefixo}.cClassTrib`,
          "cClassTrib IBS/CBS deve possuir 6 dígitos.",
          contexto
        );
      }
    }
  });
}

function validarTotais(totais, erros) {
  const t = totais || {};
  const produtos = numero(t.valorProdutos);
  const total = numero(t.valorTotal);
  const desconto = numero(t.valorDesconto || 0);

  if (!Number.isFinite(produtos) || produtos <= 0) adicionarErro(erros, "totais.valorProdutos", "Total dos produtos deve ser maior que zero.");
  if (!Number.isFinite(total) || total <= 0) adicionarErro(erros, "totais.valorTotal", "Valor total da NF-e deve ser maior que zero.");
  if (!Number.isFinite(desconto) || desconto < 0) adicionarErro(erros, "totais.valorDesconto", "Desconto não pode ser negativo.");
  if (Number.isFinite(produtos) && Number.isFinite(desconto) && desconto > produtos) adicionarErro(erros, "totais.valorDesconto", "Desconto não pode ser maior que o total dos produtos.");
}

function validarCertificado(erros) {
  const resultado = validarCertificadoA1();
  if (!resultado.valido) {
    adicionarErro(erros, "certificadoA1", resultado.message || "Certificado digital A1 inválido ou não configurado.");
    return;
  }

  const validoAte = resultado.validoAte ? new Date(resultado.validoAte) : null;
  if (validoAte && !Number.isNaN(validoAte.getTime()) && validoAte.getTime() < Date.now()) {
    adicionarErro(erros, "certificadoA1.validade", `Certificado digital expirou em ${validoAte.toLocaleDateString("pt-BR")}.`);
  }
}

function formatarMensagem(erros) {
  const linhas = erros.map((erro, indice) => {
    const contexto = erro.contexto ? `${erro.contexto}: ` : "";
    return `${indice + 1}. ${contexto}${erro.mensagem}`;
  });
  return `Não foi possível gerar a NF-e. Corrija os dados fiscais abaixo:\n${linhas.join("\n")}`;
}

class ErroValidacaoFiscal extends Error {
  constructor(erros) {
    super(formatarMensagem(erros));
    this.name = "ErroValidacaoFiscal";
    this.codigo = "VALIDACAO_FISCAL_FALHOU";
    this.statusCode = 422;
    this.erros = erros;
  }
}

function validarAntesDeGerarNfe({ empresa, destinatario, itens, totais, validarA1 = true }) {
  const erros = [];

  validarEmpresa(empresa, erros);
  validarDestinatario(destinatario, erros);
  validarItens(itens, erros, empresa);
  validarTotais(totais, erros);
  if (validarA1) validarCertificado(erros);

  if (erros.length) throw new ErroValidacaoFiscal(erros);

  return {
    valido: true,
    cpf: somenteNumeros(destinatario?.cpf),
    cnpjDestinatario: somenteNumeros(destinatario?.cnpj),
    cnpjEmitente: somenteNumeros(empresa?.cnpj || empresa?.documento),
  };
}

module.exports = {
  ErroValidacaoFiscal,
  somenteNumeros,
  validarCpf,
  validarCnpj,
  obterEnderecoFiscalEmpresa,
  validarAntesDeGerarNfe,
};
