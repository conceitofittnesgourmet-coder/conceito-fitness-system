import { Minus, Plus } from "lucide-react";
import { totalEscolhasDoGrupo } from "../ConfiguradorUniversal/configuradorUtils";

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function GrupoConfiguracao({ grupo, opcoes, selecionadas, onChange }) {
  const minimo = Number(
    grupo.obrigatorio
      ? Math.max(1, grupo.minimoEscolhas || 0)
      : grupo.minimoEscolhas || 0
  );
  const maximo = Math.max(minimo, Number(grupo.maximoEscolhas || 1));
  const obrigatorio = Boolean(grupo.obrigatorio || minimo > 0);
  const permiteQuantidade = Boolean(grupo.permiteQuantidadePorOpcao);
  const quantidadeMaxima = Math.max(
    1,
    Number(grupo.quantidadeMaximaPorOpcao || 1)
  );
  const totalEscolhas = totalEscolhasDoGrupo(grupo, selecionadas);

  function encontrar(opcao) {
    return selecionadas.find(
      (item) => String(item._id) === String(opcao._id)
    );
  }

  function atualizarQuantidade(opcao, novaQuantidade) {
    if (opcao.indisponivel) return;

    const existente = encontrar(opcao);
    const quantidadeAtual = Number(existente?.quantidade || 0);
    const quantidade = Math.max(0, Math.min(quantidadeMaxima, novaQuantidade));
    const totalSemAtual = totalEscolhas - quantidadeAtual;

    if (quantidade > 0 && totalSemAtual + quantidade > maximo) {
      alert(`Você pode escolher no máximo ${maximo} item(ns).`);
      return;
    }

    if (quantidade === 0) {
      if (obrigatorio && selecionadas.length === 1 && minimo > 0) return;
      onChange(
        selecionadas.filter(
          (item) => String(item._id) !== String(opcao._id)
        )
      );
      return;
    }

    if (existente) {
      onChange(
        selecionadas.map((item) =>
          String(item._id) === String(opcao._id)
            ? { ...item, quantidade }
            : item
        )
      );
      return;
    }

    onChange([...selecionadas, { ...opcao, quantidade }]);
  }

  function toggleOpcao(opcao) {
    if (opcao.indisponivel) return;

    const existente = encontrar(opcao);

    if (permiteQuantidade) {
      atualizarQuantidade(opcao, existente ? 0 : 1);
      return;
    }

    if (maximo === 1) {
      onChange(existente && !obrigatorio ? [] : [{ ...opcao, quantidade: 1 }]);
      return;
    }

    if (existente) {
      onChange(
        selecionadas.filter(
          (item) => String(item._id) !== String(opcao._id)
        )
      );
      return;
    }

    if (selecionadas.length >= maximo) {
      alert(`Você pode escolher no máximo ${maximo} opção(ões).`);
      return;
    }

    onChange([...selecionadas, { ...opcao, quantidade: 1 }]);
  }

  return (
    <div className="co-config-group">
      <div className="co-config-title">
        <div>
          <h3>{grupo.nome}</h3>
          <p>
            {obrigatorio ? "Obrigatório" : "Opcional"}
            {minimo > 0 ? ` · mínimo ${minimo}` : ""}
            {` · máximo ${maximo}`}
            {permiteQuantidade ? " · permite repetir" : ""}
          </p>
        </div>
        <span className="co-config-counter">
          {totalEscolhas}/{maximo}
        </span>
      </div>

      <div className={`co-config-options visual-${grupo.visualizacao || "lista"}`}>
        {opcoes.map((opcao) => {
          const selecionada = encontrar(opcao);
          const ativo = Boolean(selecionada);
          const quantidade = Number(selecionada?.quantidade || 0);

          return (
            <div
              key={opcao._id}
              className={`co-config-option ${ativo ? "active" : ""} ${
                opcao.indisponivel ? "disabled" : ""
              }`.trim()}
            >
              <button
                type="button"
                className="co-config-option-main"
                disabled={opcao.indisponivel}
                title={opcao.motivoIndisponibilidade || ""}
                onClick={() => toggleOpcao(opcao)}
              >
                <span>
                  {opcao.nome}
                  {opcao.descricao && <small>{opcao.descricao}</small>}
                  {opcao.indisponivel && (
                    <small>
                      {opcao.motivoIndisponibilidade || "Indisponível"}
                    </small>
                  )}
                </span>

                {Number(opcao.precoAdicional || 0) > 0 && (
                  <strong>+ {moeda(opcao.precoAdicional)}</strong>
                )}
              </button>

              {permiteQuantidade && ativo && !opcao.indisponivel && (
                <div className="co-config-option-qty">
                  <button
                    type="button"
                    aria-label={`Diminuir ${opcao.nome}`}
                    onClick={() => atualizarQuantidade(opcao, quantidade - 1)}
                  >
                    <Minus size={15} />
                  </button>
                  <strong>{quantidade}</strong>
                  <button
                    type="button"
                    aria-label={`Aumentar ${opcao.nome}`}
                    disabled={
                      quantidade >= quantidadeMaxima || totalEscolhas >= maximo
                    }
                    onClick={() => atualizarQuantidade(opcao, quantidade + 1)}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GrupoConfiguracao;
