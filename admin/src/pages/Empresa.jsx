import { useEffect, useMemo, useState } from "react";
import { FaBuilding, FaCheckCircle, FaExclamationTriangle, FaSave } from "react-icons/fa";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/empresa.css";

const vazio = {
  nomeFantasia: "Conceito Fitness Gourmet",
  razaoSocial: "",
  cnpj: "",
  inscricaoEstadual: "",
  inscricaoMunicipal: "",
  cnae: "",
  crt: 1,
  email: "",
  telefone: "",
  whatsapp: "",
  instagram: "",
  logo: "",
  mensagemCupom: "",
  taxaEntregaPadrao: 0,
  ativa: true,
  enderecoFiscal: {
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    codigoMunicipioIbge: "",
    uf: "PR",
    codigoPais: "1058",
    pais: "Brasil",
  },
  dadosComerciais: {
    site: "",
    chavePix: "",
    horarioAtendimento: "",
    observacoes: "",
  },
};

function somenteNumeros(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function formatarCnpj(valor) {
  const n = somenteNumeros(valor).slice(0, 14);
  return n
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatarCep(valor) {
  return somenteNumeros(valor).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

function Empresa() {
  const [form, setForm] = useState(vazio);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  const pendencias = useMemo(() => {
    const e = form.enderecoFiscal || {};
    const lista = [];
    if (somenteNumeros(form.cnpj).length !== 14) lista.push("CNPJ");
    if (!form.razaoSocial?.trim()) lista.push("Razão social");
    if (!form.inscricaoEstadual?.trim()) lista.push("Inscrição estadual");
    if (!form.crt) lista.push("CRT");
    if (somenteNumeros(e.cep).length !== 8) lista.push("CEP fiscal");
    if (!e.logradouro?.trim()) lista.push("Logradouro");
    if (!e.numero?.trim()) lista.push("Número");
    if (!e.bairro?.trim()) lista.push("Bairro");
    if (!e.cidade?.trim()) lista.push("Cidade");
    if (somenteNumeros(e.codigoMunicipioIbge).length !== 7) lista.push("Código IBGE");
    if (String(e.uf || "").length !== 2) lista.push("UF");
    return lista;
  }, [form]);

  async function carregar() {
    setCarregando(true);
    setMensagem(null);
    try {
      const response = await api.get("/empresa");
      const empresa = response.data?.empresa || {};
      setForm({
        ...vazio,
        ...empresa,
        enderecoFiscal: { ...vazio.enderecoFiscal, ...(empresa.enderecoFiscal || {}) },
        dadosComerciais: { ...vazio.dadosComerciais, ...(empresa.dadosComerciais || {}) },
      });
    } catch (error) {
      setMensagem({ tipo: "erro", texto: error.response?.data?.message || "Não foi possível carregar os dados da empresa." });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function alterarCampo(nome, valor) {
    setForm((atual) => ({ ...atual, [nome]: valor }));
  }

  function alterarEndereco(nome, valor) {
    setForm((atual) => ({
      ...atual,
      enderecoFiscal: { ...atual.enderecoFiscal, [nome]: valor },
    }));
  }

  function alterarComercial(nome, valor) {
    setForm((atual) => ({
      ...atual,
      dadosComerciais: { ...atual.dadosComerciais, [nome]: valor },
    }));
  }

  function preencherDadosConhecidos() {
    setForm((atual) => ({
      ...atual,
      nomeFantasia: atual.nomeFantasia || "Conceito Fitness Gourmet",
      razaoSocial: atual.razaoSocial || "Conceito Fitness Gourmet Ltda",
      cnpj: atual.cnpj || "67199298000181",
      inscricaoEstadual: atual.inscricaoEstadual || "9123591400",
      cnae: atual.cnae || "5611-2/03",
      email: atual.email || "conceitofittnesgourmet@gmail.com",
      telefone: atual.telefone || "(44) 99103-0076",
      whatsapp: atual.whatsapp || "(44) 99103-0076",
      enderecoFiscal: {
        ...atual.enderecoFiscal,
        cep: atual.enderecoFiscal?.cep || "87502000",
        logradouro: atual.enderecoFiscal?.logradouro || "Avenida Paraná",
        numero: atual.enderecoFiscal?.numero || "8455",
        complemento: atual.enderecoFiscal?.complemento || "Cond. Shopping Palladium",
        bairro: atual.enderecoFiscal?.bairro || "Zona III",
        cidade: atual.enderecoFiscal?.cidade || "Umuarama",
        codigoMunicipioIbge: atual.enderecoFiscal?.codigoMunicipioIbge || "4128104",
        uf: atual.enderecoFiscal?.uf || "PR",
      },
    }));
    setMensagem({ tipo: "info", texto: "Dados conhecidos preenchidos. Confira o CRT e salve o cadastro." });
  }

  async function salvar(event) {
    event.preventDefault();
    setSalvando(true);
    setMensagem(null);
    try {
      const payload = {
        ...form,
        cnpj: somenteNumeros(form.cnpj),
        inscricaoEstadual: somenteNumeros(form.inscricaoEstadual),
        enderecoFiscal: {
          ...form.enderecoFiscal,
          cep: somenteNumeros(form.enderecoFiscal?.cep),
          codigoMunicipioIbge: somenteNumeros(form.enderecoFiscal?.codigoMunicipioIbge),
        },
      };
      const response = await api.put("/empresa", payload);
      setForm((atual) => ({
        ...atual,
        ...(response.data?.empresa || {}),
        enderecoFiscal: { ...vazio.enderecoFiscal, ...(response.data?.empresa?.enderecoFiscal || {}) },
        dadosComerciais: { ...vazio.dadosComerciais, ...(response.data?.empresa?.dadosComerciais || {}) },
      }));
      setMensagem({ tipo: "sucesso", texto: "Dados da empresa salvos. O diagnóstico fiscal já pode ser atualizado." });
    } catch (error) {
      setMensagem({ tipo: "erro", texto: error.response?.data?.message || "Não foi possível salvar os dados da empresa." });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AdminLayout title="Empresa" subtitle="Cadastro central da Conceito Fitness Gourmet">
      <div className="empresa-page">
        <section className="empresa-hero">
          <div>
            <span className="empresa-kicker"><FaBuilding /> Identidade empresarial</span>
            <h2>Dados da empresa</h2>
            <p>Este cadastro alimenta o Fiscal, relatórios, orçamentos, PDV e demais módulos do ERP.</p>
          </div>
          <div className={`empresa-status ${pendencias.length ? "pendente" : "completo"}`}>
            {pendencias.length ? <FaExclamationTriangle /> : <FaCheckCircle />}
            <div>
              <strong>{pendencias.length ? `${pendencias.length} pendência(s)` : "Cadastro fiscal completo"}</strong>
              <span>{pendencias.length ? "Complete os campos essenciais" : "Pronto para validação fiscal"}</span>
            </div>
          </div>
        </section>

        {mensagem && <div className={`empresa-alerta ${mensagem.tipo}`}>{mensagem.texto}</div>}

        <div className="empresa-toolbar">
          <button type="button" className="empresa-btn secundario" onClick={preencherDadosConhecidos} disabled={carregando || salvando}>
            Preencher dados conhecidos
          </button>
          <span>Confira especialmente o regime tributário antes de salvar.</span>
        </div>

        <form onSubmit={salvar}>
          <section className="empresa-card">
            <div className="empresa-card-header">
              <div><span>01</span><h3>Identificação</h3></div>
              <p>Dados oficiais do estabelecimento emissor.</p>
            </div>
            <div className="empresa-grid">
              <label className="span-2">Nome fantasia<input value={form.nomeFantasia || ""} onChange={(e) => alterarCampo("nomeFantasia", e.target.value)} disabled={carregando} /></label>
              <label className="span-2">Razão social<input value={form.razaoSocial || ""} onChange={(e) => alterarCampo("razaoSocial", e.target.value)} disabled={carregando} /></label>
              <label>CNPJ<input value={formatarCnpj(form.cnpj)} onChange={(e) => alterarCampo("cnpj", somenteNumeros(e.target.value))} disabled={carregando} /></label>
              <label>Inscrição estadual<input value={form.inscricaoEstadual || ""} onChange={(e) => alterarCampo("inscricaoEstadual", e.target.value)} disabled={carregando} /></label>
              <label>Inscrição municipal<input value={form.inscricaoMunicipal || ""} onChange={(e) => alterarCampo("inscricaoMunicipal", e.target.value)} disabled={carregando} /></label>
              <label>CNAE<input value={form.cnae || ""} onChange={(e) => alterarCampo("cnae", e.target.value)} disabled={carregando} /></label>
              <label>Regime tributário (CRT)
                <select value={form.crt || 1} onChange={(e) => alterarCampo("crt", Number(e.target.value))} disabled={carregando}>
                  <option value={1}>1 — Simples Nacional</option>
                  <option value={2}>2 — Simples Nacional, excesso de sublimite</option>
                  <option value={3}>3 — Regime Normal</option>
                  <option value={4}>4 — MEI</option>
                </select>
              </label>
              <label className="check-field"><input type="checkbox" checked={form.ativa !== false} onChange={(e) => alterarCampo("ativa", e.target.checked)} /> Empresa ativa</label>
            </div>
          </section>

          <section className="empresa-card">
            <div className="empresa-card-header"><div><span>02</span><h3>Endereço fiscal</h3></div><p>Usado na NF-e, NFC-e e documentos oficiais.</p></div>
            <div className="empresa-grid">
              <label>CEP<input value={formatarCep(form.enderecoFiscal?.cep)} onChange={(e) => alterarEndereco("cep", somenteNumeros(e.target.value))} /></label>
              <label className="span-2">Logradouro<input value={form.enderecoFiscal?.logradouro || ""} onChange={(e) => alterarEndereco("logradouro", e.target.value)} /></label>
              <label>Número<input value={form.enderecoFiscal?.numero || ""} onChange={(e) => alterarEndereco("numero", e.target.value)} /></label>
              <label className="span-2">Complemento<input value={form.enderecoFiscal?.complemento || ""} onChange={(e) => alterarEndereco("complemento", e.target.value)} /></label>
              <label>Bairro<input value={form.enderecoFiscal?.bairro || ""} onChange={(e) => alterarEndereco("bairro", e.target.value)} /></label>
              <label>Cidade<input value={form.enderecoFiscal?.cidade || ""} onChange={(e) => alterarEndereco("cidade", e.target.value)} /></label>
              <label>Código IBGE<input maxLength={7} value={form.enderecoFiscal?.codigoMunicipioIbge || ""} onChange={(e) => alterarEndereco("codigoMunicipioIbge", somenteNumeros(e.target.value))} /></label>
              <label>UF<input maxLength={2} value={form.enderecoFiscal?.uf || ""} onChange={(e) => alterarEndereco("uf", e.target.value.toUpperCase())} /></label>
              <label>País<input value={form.enderecoFiscal?.pais || "Brasil"} onChange={(e) => alterarEndereco("pais", e.target.value)} /></label>
            </div>
          </section>

          <section className="empresa-card">
            <div className="empresa-card-header"><div><span>03</span><h3>Contato e comercial</h3></div><p>Informações reutilizadas em documentos e canais de atendimento.</p></div>
            <div className="empresa-grid">
              <label className="span-2">E-mail<input type="email" value={form.email || ""} onChange={(e) => alterarCampo("email", e.target.value)} /></label>
              <label>Telefone<input value={form.telefone || ""} onChange={(e) => alterarCampo("telefone", e.target.value)} /></label>
              <label>WhatsApp<input value={form.whatsapp || ""} onChange={(e) => alterarCampo("whatsapp", e.target.value)} /></label>
              <label>Instagram<input value={form.instagram || ""} onChange={(e) => alterarCampo("instagram", e.target.value)} /></label>
              <label>Site<input value={form.dadosComerciais?.site || ""} onChange={(e) => alterarComercial("site", e.target.value)} /></label>
              <label>Chave PIX<input value={form.dadosComerciais?.chavePix || ""} onChange={(e) => alterarComercial("chavePix", e.target.value)} /></label>
              <label className="span-2">Horário de atendimento<input value={form.dadosComerciais?.horarioAtendimento || ""} onChange={(e) => alterarComercial("horarioAtendimento", e.target.value)} /></label>
              <label className="span-4">Observações<textarea rows={4} value={form.dadosComerciais?.observacoes || ""} onChange={(e) => alterarComercial("observacoes", e.target.value)} /></label>
            </div>
          </section>

          {pendencias.length > 0 && (
            <section className="empresa-pendencias">
              <strong>Campos essenciais ainda pendentes:</strong>
              <span>{pendencias.join(" • ")}</span>
            </section>
          )}

          <button className="empresa-salvar" type="submit" disabled={carregando || salvando}>
            <FaSave /> {salvando ? "Salvando..." : "Salvar dados da empresa"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}

export default Empresa;
