import { FaBullhorn, FaCalendarAlt, FaClock, FaTags } from "react-icons/fa";

const DIAS_SEMANA = [
  ["segunda", "Segunda"],
  ["terca", "Terça"],
  ["quarta", "Quarta"],
  ["quinta", "Quinta"],
  ["sexta", "Sexta"],
  ["sabado", "Sábado"],
  ["domingo", "Domingo"],
];

function PublicacaoOnlineProduto({
  publicacao,
  setPublicacao,
  preco,
}) {
  const dados = publicacao || {};

  function alterar(campo, valor) {
    setPublicacao((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function alterarCanal(canal, valor) {
    setPublicacao((atual) => ({
      ...atual,
      canais: {
        ...(atual?.canais || {}),
        [canal]: valor,
      },
    }));
  }

  function alterarDia(dia, valor) {
    setPublicacao((atual) => ({
      ...atual,
      diasDisponiveis: {
        ...(atual?.diasDisponiveis || {}),
        [dia]: valor,
      },
    }));
  }

  return (
    <div className="publicacao-online-produto">
      <section className="premium-box">
        <h3>
          <FaBullhorn />
          Publicação Online
        </h3>

        <div className="chips-premium">
          <label>
            <input
              type="checkbox"
              checked={dados.publicado !== false}
              onChange={(e) => alterar("publicado", e.target.checked)}
            />
            Produto publicado
          </label>

          <label>
            <input
              type="checkbox"
              checked={Boolean(dados.destaque)}
              onChange={(e) => alterar("destaque", e.target.checked)}
            />
            Destaque
          </label>

          <label>
            <input
              type="checkbox"
              checked={Boolean(dados.novidade)}
              onChange={(e) => alterar("novidade", e.target.checked)}
            />
            Novidade
          </label>

          <label>
            <input
              type="checkbox"
              checked={Boolean(dados.maisVendido)}
              onChange={(e) => alterar("maisVendido", e.target.checked)}
            />
            Mais vendido
          </label>

          <label>
            <input
              type="checkbox"
              checked={Boolean(dados.exclusivoClube)}
              onChange={(e) => alterar("exclusivoClube", e.target.checked)}
            />
            Exclusivo Clube
          </label>
        </div>
      </section>

      <section className="premium-box">
        <h3>Canais de publicação</h3>

        <div className="chips-premium">
          <label>
            <input
              type="checkbox"
              checked={dados.canais?.cardapio !== false}
              onChange={(e) =>
                alterarCanal("cardapio", e.target.checked)
              }
            />
            Cardápio Online
          </label>

          <label>
            <input
              type="checkbox"
              checked={dados.canais?.site !== false}
              onChange={(e) => alterarCanal("site", e.target.checked)}
            />
            Site
          </label>

          <label>
            <input
              type="checkbox"
              checked={dados.canais?.whatsapp !== false}
              onChange={(e) =>
                alterarCanal("whatsapp", e.target.checked)
              }
            />
            WhatsApp
          </label>

          <label>
            <input
              type="checkbox"
              checked={dados.canais?.pdv !== false}
              onChange={(e) => alterarCanal("pdv", e.target.checked)}
            />
            PDV
          </label>

          <label>
            <input
              type="checkbox"
              checked={Boolean(dados.canais?.ifood)}
              onChange={(e) => alterarCanal("ifood", e.target.checked)}
            />
            iFood
          </label>

          <label>
            <input
              type="checkbox"
              checked={Boolean(dados.canais?.aiqfome)}
              onChange={(e) =>
                alterarCanal("aiqfome", e.target.checked)
              }
            />
            aiqfome
          </label>
        </div>
      </section>

      <section className="premium-box">
        <h3>Disponibilidade</h3>

        <label className="premium-switch">
          <div>
            <strong>Produto disponível</strong>
            <span>
              Desative para impedir novos pedidos temporariamente.
            </span>
          </div>

          <input
            type="checkbox"
            checked={dados.disponivel !== false}
            onChange={(e) => alterar("disponivel", e.target.checked)}
          />
        </label>

        {dados.disponivel === false && (
          <div className="field-premium full">
            <label>Motivo da indisponibilidade</label>

            <input
              placeholder="Ex.: Produto esgotado ou produção encerrada"
              value={dados.motivoIndisponibilidade || ""}
              onChange={(e) =>
                alterar("motivoIndisponibilidade", e.target.value)
              }
            />
          </div>
        )}

        <div className="field-premium">
          <label>Ordem de exibição</label>

          <input
            type="number"
            min="0"
            step="1"
            value={dados.ordem ?? 0}
            onChange={(e) =>
              alterar("ordem", Number(e.target.value || 0))
            }
          />
        </div>
      </section>

      <section className="premium-box">
        <h3>
          <FaTags />
          Promoção
        </h3>

        <label className="premium-switch">
          <div>
            <strong>Produto em promoção</strong>
            <span>Exibe o preço promocional no cardápio.</span>
          </div>

          <input
            type="checkbox"
            checked={Boolean(dados.promocao?.ativa)}
            onChange={(e) =>
              setPublicacao((atual) => ({
                ...atual,
                promocao: {
                  ...(atual?.promocao || {}),
                  ativa: e.target.checked,
                },
              }))
            }
          />
        </label>

        {dados.promocao?.ativa && (
          <div className="mini-grid">
            <div className="field-premium">
              <label>Preço original</label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  dados.promocao?.precoOriginal ??
                  preco ??
                  ""
                }
                onChange={(e) =>
                  setPublicacao((atual) => ({
                    ...atual,
                    promocao: {
                      ...(atual?.promocao || {}),
                      precoOriginal: e.target.value,
                    },
                  }))
                }
              />
            </div>

            <div className="field-premium">
              <label>Preço promocional</label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={dados.promocao?.precoPromocional || ""}
                onChange={(e) =>
                  setPublicacao((atual) => ({
                    ...atual,
                    promocao: {
                      ...(atual?.promocao || {}),
                      precoPromocional: e.target.value,
                    },
                  }))
                }
              />
            </div>

            <div className="field-premium">
              <label>Início da promoção</label>

              <input
                type="datetime-local"
                value={dados.promocao?.inicio || ""}
                onChange={(e) =>
                  setPublicacao((atual) => ({
                    ...atual,
                    promocao: {
                      ...(atual?.promocao || {}),
                      inicio: e.target.value,
                    },
                  }))
                }
              />
            </div>

            <div className="field-premium">
              <label>Fim da promoção</label>

              <input
                type="datetime-local"
                value={dados.promocao?.fim || ""}
                onChange={(e) =>
                  setPublicacao((atual) => ({
                    ...atual,
                    promocao: {
                      ...(atual?.promocao || {}),
                      fim: e.target.value,
                    },
                  }))
                }
              />
            </div>
          </div>
        )}
      </section>

      <section className="premium-box">
        <h3>
          <FaClock />
          Horários
        </h3>

        <label className="premium-switch">
          <div>
            <strong>Limitar por horário</strong>
            <span>
              O produto ficará disponível somente no período configurado.
            </span>
          </div>

          <input
            type="checkbox"
            checked={Boolean(dados.horarioLimitado)}
            onChange={(e) =>
              alterar("horarioLimitado", e.target.checked)
            }
          />
        </label>

        {dados.horarioLimitado && (
          <div className="mini-grid">
            <div className="field-premium">
              <label>Horário inicial</label>

              <input
                type="time"
                value={dados.horarioInicio || ""}
                onChange={(e) =>
                  alterar("horarioInicio", e.target.value)
                }
              />
            </div>

            <div className="field-premium">
              <label>Horário final</label>

              <input
                type="time"
                value={dados.horarioFim || ""}
                onChange={(e) =>
                  alterar("horarioFim", e.target.value)
                }
              />
            </div>
          </div>
        )}
      </section>

      <section className="premium-box">
        <h3>
          <FaCalendarAlt />
          Dias disponíveis
        </h3>

        <div className="chips-premium">
          {DIAS_SEMANA.map(([dia, label]) => (
            <label key={dia}>
              <input
                type="checkbox"
                checked={dados.diasDisponiveis?.[dia] !== false}
                onChange={(e) =>
                  alterarDia(dia, e.target.checked)
                }
              />

              {label}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

export default PublicacaoOnlineProduto;