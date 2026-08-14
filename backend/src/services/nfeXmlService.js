const crypto = require("crypto");
const { obterEnderecoFiscalEmpresa } = require("./fiscalValidationService");

function somenteNumeros(v) { return String(v || "").replace(/\D/g, ""); }
function esc(v) { return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
function n2(v) { return Number(v || 0).toFixed(2); }
function n4(v) { return Number(v || 0).toFixed(4); }
function z(v, t) { return String(v || "").padStart(t, "0"); }
function dataSp(date = new Date()) {
  const p = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false }).formatToParts(date);
  const o = Object.fromEntries(p.map(x => [x.type, x.value]));
  return `${o.year}-${o.month}-${o.day}T${o.hour}:${o.minute}:${o.second}-03:00`;
}
function digito(chave43) {
  let peso=2, soma=0;
  for (let i=chave43.length-1;i>=0;i--) { soma += Number(chave43[i])*peso; peso = peso===9 ? 2 : peso+1; }
  const r=11-(soma%11); return r===10 || r===11 ? 0 : r;
}
function codigoNumerico() { return String(crypto.randomInt(0, 100000000)).padStart(8,"0"); }

function criarChave({ uf="41", data=new Date(), cnpj, modelo="55", serie, numero, tpEmis=1, cNF }) {
  const ym = new Intl.DateTimeFormat("en-CA", { timeZone:"America/Sao_Paulo", year:"2-digit", month:"2-digit" }).formatToParts(data);
  const o=Object.fromEntries(ym.map(x=>[x.type,x.value]));
  const base = `${uf}${o.year}${o.month}${z(somenteNumeros(cnpj),14)}${modelo}${z(serie,3)}${z(numero,9)}${tpEmis}${cNF}`;
  return base + digito(base);
}

function validarEndereco(end, rotulo) {
  const faltantes=[];
  if (!end?.logradouro) faltantes.push("logradouro");
  if (!end?.numero) faltantes.push("número");
  if (!end?.bairro) faltantes.push("bairro");
  if (!end?.cidade) faltantes.push("cidade");
  if (!end?.codigoMunicipioIbge) faltantes.push("código IBGE");
  if (!end?.uf) faltantes.push("UF");
  if (faltantes.length) throw new Error(`${rotulo}: faltam ${faltantes.join(", ")}.`);
}

function montarImposto(item) {
  const icms = item.csosn
    ? `<ICMSSN102><orig>${esc(item.origem || "0")}</orig><CSOSN>${esc(item.csosn)}</CSOSN></ICMSSN102>`
    : `<ICMS00><orig>${esc(item.origem || "0")}</orig><CST>${esc(item.cstIcms || "00")}</CST><modBC>3</modBC><vBC>${n2(item.valorProduto)}</vBC><pICMS>${n2(item.aliquotaIcms)}</pICMS><vICMS>${n2(item.valorIcms)}</vICMS></ICMS00>`;
  const pis = `<PISOutr><CST>${esc(item.cstPis || "99")}</CST><vBC>${n2(item.valorProduto)}</vBC><pPIS>${n4(item.aliquotaPis)}</pPIS><vPIS>${n2(item.valorPis)}</vPIS></PISOutr>`;
  const cofins = `<COFINSOutr><CST>${esc(item.cstCofins || "99")}</CST><vBC>${n2(item.valorProduto)}</vBC><pCOFINS>${n4(item.aliquotaCofins)}</pCOFINS><vCOFINS>${n2(item.valorCofins)}</vCOFINS></COFINSOutr>`;
  return `<imposto><ICMS>${icms}</ICMS><PIS>${pis}</PIS><COFINS>${cofins}</COFINS></imposto>`;
}

function gerarXmlNfe({ nfe, empresa }) {
  if (!nfe) throw new Error("NF-e não informada para geração do XML.");
  if (!empresa) throw new Error("Empresa emissora não encontrada.");
  const cnpj = somenteNumeros(empresa.cnpj || empresa.documento);
  const ie = somenteNumeros(empresa.inscricaoEstadual || empresa.ie);
  if (cnpj.length !== 14) throw new Error("CNPJ da empresa emissora inválido.");
  if (!ie) throw new Error("Inscrição Estadual da empresa emissora não cadastrada.");

  const endEmit = obterEnderecoFiscalEmpresa(empresa);
  validarEndereco(endEmit, "Endereço do emitente");
  validarEndereco(nfe.destinatario?.endereco, "Endereço do destinatário");
  if (!Array.isArray(nfe.itens) || !nfe.itens.length) throw new Error("NF-e sem itens.");

  const cNF = codigoNumerico();
  const dhEmi = dataSp(nfe.dataEmissao || new Date());
  const chave = criarChave({ cnpj, serie:nfe.serie, numero:nfe.numero, cNF });
  const id = `NFe${chave}`;
  const dest = nfe.destinatario;
  const docDest = dest.cnpj ? `<CNPJ>${somenteNumeros(dest.cnpj)}</CNPJ>` : `<CPF>${somenteNumeros(dest.cpf)}</CPF>`;
  const indIEDest = Number(dest.indicadorIe || 9);
  const ieDest = dest.inscricaoEstadual ? `<IE>${somenteNumeros(dest.inscricaoEstadual)}</IE>` : "";

  const itensXml = nfe.itens.map((item, i) => `<det nItem="${i+1}"><prod><cProd>${esc(item.codigo || i+1)}</cProd><cEAN>${esc(item.gtin || "SEM GTIN")}</cEAN><xProd>${esc(item.descricao)}</xProd><NCM>${somenteNumeros(item.ncm)}</NCM>${item.cest ? `<CEST>${somenteNumeros(item.cest)}</CEST>` : ""}<CFOP>${somenteNumeros(item.cfop)}</CFOP><uCom>${esc(item.unidadeComercial || "UN")}</uCom><qCom>${n4(item.quantidadeComercial)}</qCom><vUnCom>${n4(item.valorUnitarioComercial)}</vUnCom><vProd>${n2(item.valorProduto)}</vProd><cEANTrib>${esc(item.gtinTributavel || "SEM GTIN")}</cEANTrib><uTrib>${esc(item.unidadeTributavel || "UN")}</uTrib><qTrib>${n4(item.quantidadeTributavel)}</qTrib><vUnTrib>${n4(item.valorUnitarioTributavel)}</vUnTrib><indTot>1</indTot></prod>${montarImposto(item)}</det>`).join("");

  const t=nfe.totais;
  const xml=`<?xml version="1.0" encoding="UTF-8"?><NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="${id}" versao="4.00"><ide><cUF>41</cUF><cNF>${cNF}</cNF><natOp>${esc(nfe.naturezaOperacao || "Venda de mercadoria")}</natOp><mod>55</mod><serie>${nfe.serie}</serie><nNF>${nfe.numero}</nNF><dhEmi>${dhEmi}</dhEmi><tpNF>1</tpNF><idDest>${nfe.destinoOperacao || 1}</idDest><cMunFG>${esc(endEmit.codigoMunicipioIbge || endEmit.codigoIbge)}</cMunFG><tpImp>1</tpImp><tpEmis>1</tpEmis><cDV>${chave.slice(-1)}</cDV><tpAmb>${nfe.ambiente === "producao" ? 1 : 2}</tpAmb><finNFe>${nfe.finalidade || 1}</finNFe><indFinal>${nfe.consumidorFinal ? 1 : 0}</indFinal><indPres>${nfe.indicadorPresenca ?? 1}</indPres><procEmi>0</procEmi><verProc>ConceitoFitERP1.0</verProc></ide><emit><CNPJ>${cnpj}</CNPJ><xNome>${esc(empresa.razaoSocial || empresa.nome || "CONCEITO FITNESS")}</xNome><xFant>${esc(empresa.nomeFantasia || empresa.fantasia || "CONCEITO FITNESS")}</xFant><enderEmit><xLgr>${esc(endEmit.logradouro || endEmit.rua)}</xLgr><nro>${esc(endEmit.numero)}</nro>${endEmit.complemento ? `<xCpl>${esc(endEmit.complemento)}</xCpl>` : ""}<xBairro>${esc(endEmit.bairro)}</xBairro><cMun>${esc(endEmit.codigoMunicipioIbge || endEmit.codigoIbge)}</cMun><xMun>${esc(endEmit.cidade || endEmit.municipio)}</xMun><UF>${esc(endEmit.uf)}</UF>${endEmit.cep ? `<CEP>${somenteNumeros(endEmit.cep)}</CEP>` : ""}<cPais>1058</cPais><xPais>Brasil</xPais></enderEmit><IE>${ie}</IE><CRT>${Number(empresa.crt || empresa.regimeTributarioCodigo || 1)}</CRT></emit><dest>${docDest}<xNome>${esc(nfe.ambiente === "homologacao" ? "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL" : dest.nomeRazaoSocial)}</xNome><enderDest><xLgr>${esc(dest.endereco.logradouro)}</xLgr><nro>${esc(dest.endereco.numero)}</nro>${dest.endereco.complemento ? `<xCpl>${esc(dest.endereco.complemento)}</xCpl>` : ""}<xBairro>${esc(dest.endereco.bairro)}</xBairro><cMun>${esc(dest.endereco.codigoMunicipioIbge)}</cMun><xMun>${esc(dest.endereco.cidade)}</xMun><UF>${esc(dest.endereco.uf)}</UF>${dest.endereco.cep ? `<CEP>${somenteNumeros(dest.endereco.cep)}</CEP>` : ""}<cPais>${esc(dest.endereco.codigoPais || "1058")}</cPais><xPais>${esc(dest.endereco.pais || "Brasil")}</xPais>${dest.telefone ? `<fone>${somenteNumeros(dest.telefone)}</fone>` : ""}</enderDest><indIEDest>${indIEDest}</indIEDest>${ieDest}${dest.email ? `<email>${esc(dest.email)}</email>` : ""}</dest>${itensXml}<total><ICMSTot><vBC>0.00</vBC><vICMS>${n2(t.valorIcms)}</vICMS><vICMSDeson>0.00</vICMSDeson><vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet><vProd>${n2(t.valorProdutos)}</vProd><vFrete>${n2(t.valorFrete)}</vFrete><vSeg>${n2(t.valorSeguro)}</vSeg><vDesc>${n2(t.valorDesconto)}</vDesc><vII>0.00</vII><vIPI>${n2(t.valorIpi)}</vIPI><vIPIDevol>0.00</vIPIDevol><vPIS>${n2(t.valorPis)}</vPIS><vCOFINS>${n2(t.valorCofins)}</vCOFINS><vOutro>${n2(t.outrasDespesas)}</vOutro><vNF>${n2(t.valorTotal)}</vNF></ICMSTot></total><transp><modFrete>${nfe.modalidadeFrete ?? 9}</modFrete></transp><pag><detPag><indPag>0</indPag><tPag>${esc(nfe.pagamento?.forma || "17")}</tPag><vPag>${n2(nfe.pagamento?.valor || t.valorTotal)}</vPag></detPag></pag>${nfe.informacoesComplementares ? `<infAdic><infCpl>${esc(nfe.informacoesComplementares)}</infCpl></infAdic>` : ""}</infNFe></NFe>`;
  return { xml, chaveAcesso:chave, idDocumento:id };
}

module.exports = { gerarXmlNfe };
