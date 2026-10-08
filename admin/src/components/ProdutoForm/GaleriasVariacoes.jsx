import { useState } from "react";

export default function GaleriasVariacoes({
  gruposComponentes = [],
  opcoesComponentes = [],
  gruposSelecionados = [],
  galerias = [],
  setGalerias,
}) {
  const [expandida, setExpandida] = useState(true);

  const gruposDisponiveis = gruposComponentes.filter((grupo) =>
    gruposSelecionados.some((id) => String(id) === String(grupo._id))
  );

  return (
    <section className="premium-box galerias-variacoes">
      <button
        type="button"
        onClick={() => setExpandida((valor) => !valor)}
        aria-expanded={expandida}
      >
        <strong>Galerias por Variação</strong>
        <span>{expandida ? "Recolher" : "Expandir"}</span>
      </button>

      {expandida && (
        <div>
          <p>
            Associe fotografias às combinações de opções do produto.
            A galeria principal permanece disponível quando não houver
            uma galeria específica.
          </p>
          <p>Grupos disponíveis: {gruposDisponiveis.length}</p>
          <p>Galerias cadastradas: {galerias.length}</p>
          <button
            type="button"
            onClick={() =>
              setGalerias((anteriores) => [
                ...anteriores,
                {
                  id: crypto.randomUUID(),
                  nome: `Galeria ${anteriores.length + 1}`,
                  ativo: true,
                  ordem: anteriores.length,
                  selecoes: [],
                  imagens: [],
                },
              ])
            }
          >
            + Adicionar galeria
          </button>
          {galerias.map((galeria, indice) => (
            <div key={galeria._id || galeria.id || indice} className="premium-box" style={{ marginTop: 16 }}>
              <label>
                Nome da galeria
                <input
                  type="text"
                  value={galeria.nome || ""}
                  onChange={(e) => setGalerias((anteriores) =>
                    anteriores.map((item, i) => i === indice ? { ...item, nome: e.target.value } : item)
                  )}
                />
              </label>
              <label style={{ display: "block", marginTop: 10 }}>
                <input
                  type="checkbox"
                  checked={galeria.ativo !== false}
                  onChange={(e) => setGalerias((anteriores) =>
                    anteriores.map((item, i) => i === indice ? { ...item, ativo: e.target.checked } : item)
                  )}
                />
                Galeria ativa
              </label>
              <div style={{ marginTop: 16 }}>
                <strong>Combinação de opções</strong>
                {gruposDisponiveis.map((grupo) => {
                  const opcoes = opcoesComponentes.filter(
                    (opcao) =>
                      String(opcao.grupo?._id || opcao.grupo) === String(grupo._id) &&
                      opcao.ativo !== false
                  );
                  const selecionada = (galeria.selecoes || []).find(
                    (item) => String(item.grupoId) === String(grupo._id)
                  );
                  return (
                    <label key={grupo._id} style={{ display: "block", marginTop: 10 }}>
                      {grupo.nome}
                      <select
                        value={selecionada?.opcaoId || ""}
                        onChange={(e) => setGalerias((anteriores) =>
                          anteriores.map((item, i) => {
                            if (i !== indice) return item;
                            const outras = (item.selecoes || []).filter(
                              (s) => String(s.grupoId) !== String(grupo._id)
                            );
                            return {
                              ...item,
                              selecoes: e.target.value
                                ? [...outras, { grupoId: grupo._id, opcaoId: e.target.value }]
                                : outras,
                            };
                          })
                        )}
                      >
                        <option value="">Não considerar este grupo</option>
                        {opcoes.map((opcao) => (
                          <option key={opcao._id} value={opcao._id}>
                            {opcao.nome}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
              <div style={{ marginTop: 16 }}>
                <strong>Fotografias desta galeria</strong>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={(e) => {
                    const arquivos = Array.from(e.target.files || []);
                    setGalerias((anteriores) =>
                      anteriores.map((item, i) =>
                        i === indice
                          ? {
                              ...item,
                              imagens: [
                                ...(item.imagens || []),
                                ...arquivos.map((file, posicao) => ({
                                  id: crypto.randomUUID(),
                                  file,
                                  preview: URL.createObjectURL(file),
                                  descricao: "",
                                  ordem: (item.imagens || []).length + posicao,
                                })),
                              ],
                            }
                          : item
                      )
                    );
                    e.target.value = "";
                  }}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
                  {(galeria.imagens || []).map((imagem, imagemIndice) => (
                    <div key={imagem.id || imagem._id || imagemIndice} style={{ width: 140 }}>
                      <img
                        src={imagem.preview || imagem.url}
                        alt={imagem.descricao || "Fotografia da variação"}
                        style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 8 }}
                      />
                      <input
                        type="text"
                        placeholder="Descrição"
                        value={imagem.descricao || ""}
                        onChange={(e) => setGalerias((anteriores) =>
                          anteriores.map((item, i) => i === indice ? {
                            ...item,
                            imagens: item.imagens.map((foto, j) =>
                              j === imagemIndice ? { ...foto, descricao: e.target.value } : foto
                            ),
                          } : item)
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (imagem.file && imagem.preview?.startsWith("blob:")) {
                            URL.revokeObjectURL(imagem.preview);
                          }
                          setGalerias((anteriores) =>
                          anteriores.map((item, i) => i === indice ? {
                            ...item,
                            imagens: item.imagens.filter((_, j) => j !== imagemIndice),
                          } : item)
                        );
                        }}
                      >
                        Remover foto
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  (galeria.imagens || []).forEach((imagem) => {
                    if (imagem.file && imagem.preview?.startsWith("blob:")) {
                      URL.revokeObjectURL(imagem.preview);
                    }
                  });
                  setGalerias((anteriores) => anteriores.filter((_, i) => i !== indice));
                }}
              >
                Remover galeria
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}