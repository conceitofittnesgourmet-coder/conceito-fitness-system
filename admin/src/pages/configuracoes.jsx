import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";
import "../styles/configuracoes.css";

export default function Configuracoes() {
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [empresa, setEmpresa] = useState({
    nomeFantasia: "",
    razaoSocial: "",
    cnpj: "",
    inscricaoEstadual: "",
    email: "",
    telefone: "",
    whatsapp: "",
    instagram: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    logo: "",
    mensagemCupom: "",
    taxaEntregaPadrao: 0,
  });

  async function carregarEmpresa() {
    try {
      const response = await api.get("/empresa");

      if (response.data?.empresa) {
        setEmpresa({
          ...empresa,
          ...response.data.empresa,
        });
      }
    } catch (error) {
      console.log("Erro ao carregar empresa:", error);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarEmpresa();
  }, []);

  function alterarCampo(campo, valor) {
    setEmpresa((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function salvarEmpresa(e) {
    e.preventDefault();

    try {
      setSalvando(true);

      const response = await api.put("/empresa", empresa);

      if (response.data?.success) {
        alert("Configurações salvas com sucesso!");
        setEmpresa(response.data.empresa);
      }
    } catch (error) {
      console.log("Erro ao salvar empresa:", error);
      alert("Erro ao salvar configurações.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AdminLayout
      title="Configurações"
      subtitle="Dados da empresa, cupom, contato e operação"
    >
      <form className="config-page" onSubmit={salvarEmpresa}>
        <section className="config-card">
          <h2>Dados da Empresa</h2>

          <div className="config-grid">
            <label>
              Nome Fantasia
              <input
                value={empresa.nomeFantasia}
                onChange={(e) => alterarCampo("nomeFantasia", e.target.value)}
                placeholder="Conceito Fitness Gourmet"
              />
            </label>

            <label>
              Razão Social
              <input
                value={empresa.razaoSocial}
                onChange={(e) => alterarCampo("razaoSocial", e.target.value)}
                placeholder="Razão social da empresa"
              />
            </label>

            <label>
              CNPJ
              <input
                value={empresa.cnpj}
                onChange={(e) => alterarCampo("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </label>

            <label>
              Inscrição Estadual
              <input
                value={empresa.inscricaoEstadual}
                onChange={(e) =>
                  alterarCampo("inscricaoEstadual", e.target.value)
                }
                placeholder="Isento ou número"
              />
            </label>
          </div>
        </section>

        <section className="config-card">
          <h2>Contato</h2>

          <div className="config-grid">
            <label>
              Email
              <input
                value={empresa.email}
                onChange={(e) => alterarCampo("email", e.target.value)}
                placeholder="email@empresa.com"
              />
            </label>

            <label>
              Telefone
              <input
                value={empresa.telefone}
                onChange={(e) => alterarCampo("telefone", e.target.value)}
                placeholder="(44) 0000-0000"
              />
            </label>

            <label>
              WhatsApp
              <input
                value={empresa.whatsapp}
                onChange={(e) => alterarCampo("whatsapp", e.target.value)}
                placeholder="(44) 90000-0000"
              />
            </label>

            <label>
              Instagram
              <input
                value={empresa.instagram}
                onChange={(e) => alterarCampo("instagram", e.target.value)}
                placeholder="@conceitofitnessgourmet"
              />
            </label>
          </div>
        </section>

        <section className="config-card">
          <h2>Endereço</h2>

          <div className="config-grid">
            <label>
              Endereço
              <input
                value={empresa.endereco}
                onChange={(e) => alterarCampo("endereco", e.target.value)}
                placeholder="Rua, número, bairro"
              />
            </label>

            <label>
              Cidade
              <input
                value={empresa.cidade}
                onChange={(e) => alterarCampo("cidade", e.target.value)}
                placeholder="Cidade"
              />
            </label>

            <label>
              Estado
              <input
                value={empresa.estado}
                onChange={(e) => alterarCampo("estado", e.target.value)}
                placeholder="PR"
              />
            </label>

            <label>
              CEP
              <input
                value={empresa.cep}
                onChange={(e) => alterarCampo("cep", e.target.value)}
                placeholder="00000-000"
              />
            </label>
          </div>
        </section>

        <section className="config-card">
          <h2>Cupom e Operação</h2>

          <div className="config-grid">
            <label>
              Logo / URL da Logo
              <input
                value={empresa.logo}
                onChange={(e) => alterarCampo("logo", e.target.value)}
                placeholder="https://..."
              />
            </label>

            <label>
              Taxa de Entrega Padrão
              <input
                type="number"
                value={empresa.taxaEntregaPadrao}
                onChange={(e) =>
                  alterarCampo("taxaEntregaPadrao", Number(e.target.value))
                }
                placeholder="0"
              />
            </label>
          </div>

          <label className="config-full">
            Mensagem Final do Cupom
            <textarea
              value={empresa.mensagemCupom}
              onChange={(e) => alterarCampo("mensagemCupom", e.target.value)}
              placeholder="Obrigado pela preferência!"
            />
          </label>
        </section>

        <div className="config-actions">
          <button type="submit" disabled={salvando || carregando}>
            {salvando ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}