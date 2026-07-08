import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import ConfiguradorEngine from "./ConfiguradorEngine";
import { calcularPrecoConfigurado } from "./CalculadoraPreco";

function ProdutoConfigModal({
  produto,
  onClose,
  onConfirmar,
}) {
  const [gruposBase, setGruposBase] = useState([]);
  const [opcoes, setOpcoes] = useState([]);
  const [escolhas, setEscolhas] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregarDados() {
    try {
      setLoading(true);

      const [gruposRes, opcoesRes] = await Promise.all([
        api.get("/grupos-componentes"),
        api.get("/opcoes-componentes"),
      ]);

      setGruposBase(gruposRes.data.grupos || []);
      setOpcoes(opcoesRes.data.opcoes || []);
    } catch (error) {
      console.log("Erro ao carregar configuração:", error);
      alert("Erro ao carregar configuração do produto.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const gruposProduto = useMemo(() => {
    const ids = produto?.gruposComponentes || [];
    const configs = produto?.configuracaoGrupos || [];

    return gruposBase
      .filter((grupo) =>
        ids.some((id) => String(id) === String(grupo._id))
      )
      .map((grupo) => {
        const config = configs.find(
          (c) => String(c.grupoId) === String(grupo._id)
        );

        return {
          ...grupo,
          config,
        };
      })
      .sort((a, b) => {
        const ordemA = Number(a.config?.ordem ?? a.ordem ?? 0);
        const ordemB = Number(b.config?.ordem ?? b.ordem ?? 0);
        return ordemA - ordemB;
      });
  }, [produto, gruposBase]);

  function validarObrigatorios() {
    for (const grupo of gruposProduto) {
      const config = grupo.config || {};
      const obrigatorio = Boolean(config.obrigatorio ?? grupo.obrigatorio);
      const minimo = Number(config.minimoEscolhas ?? grupo.minimoEscolhas ?? 0);

      if (!obrigatorio && minimo <= 0) continue;

      const totalEscolhas = escolhas.filter(
        (e) => String(e.grupoId) === String(grupo._id)
      ).length;

      if (totalEscolhas < minimo) {
        alert(`Selecione pelo menos ${minimo} opção(ões) em ${grupo.nome}.`);
        return false;
      }
    }

    return true;
  }

  function confirmar() {
    if (!validarObrigatorios()) return;

    const preco = calcularPrecoConfigurado(produto, escolhas);

    onConfirmar({
      produto,
      escolhas,
      precoFinal: preco.precoFinal,
      adicionais: preco.adicionais,
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal pdv-config-modal">
        <div className="pdv-config-modal-header">
          <div>
            <h2>Montar produto</h2>
            <p>{produto?.nome}</p>
          </div>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        {loading ? (
          <div className="pdv-config-loading">
            Carregando configuração...
          </div>
        ) : (
          <ConfiguradorEngine
            produto={produto}
            grupos={gruposProduto}
            opcoes={opcoes}
            escolhas={escolhas}
            setEscolhas={setEscolhas}
          />
        )}

        <div className="modal-buttons">
          <button className="btn-save" onClick={confirmar}>
            Adicionar ao pedido
          </button>

          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProdutoConfigModal;