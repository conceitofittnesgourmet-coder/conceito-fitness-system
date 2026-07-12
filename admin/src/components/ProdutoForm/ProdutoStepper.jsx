const ETAPAS = [
  {
    id: "basico",
    numero: 1,
    titulo: "Básico",
    descricao: "Identificação e categorias",
  },
  {
    id: "venda",
    numero: 2,
    titulo: "Venda",
    descricao: "Preço, estoque e unidade",
  },
  {
    id: "cardapio",
    numero: 3,
    titulo: "Cardápio",
    descricao: "Montagem e exibição online",
  },
  {
    id: "nutricional",
    numero: 4,
    titulo: "Nutricional",
    descricao: "Informações, selos e alergênicos",
  },
  {
    id: "fiscal",
    numero: 5,
    titulo: "Fiscal",
    descricao: "Tributação e NFC-e",
  },
  {
    id: "producao",
    numero: 6,
    titulo: "Produção",
    descricao: "Receita, validade e rendimento",
  },
  {
    id: "marketing",
    numero: 7,
    titulo: "Marketing",
    descricao: "SEO, tags e divulgação",
  },
  {
    id: "midia",
    numero: 8,
    titulo: "Mídia",
    descricao: "Imagens, vídeos e arquivos",
  },
];

function ProdutoStepper({
  abaCadastro,
  setAbaCadastro,
  progresso = 0,
  etapasConcluidas = [],
}) {
  const etapaAtualIndex = ETAPAS.findIndex(
    (etapa) => etapa.id === abaCadastro
  );

  const etapaAtual =
    etapaAtualIndex >= 0
      ? ETAPAS[etapaAtualIndex]
      : ETAPAS[0];

  return (
    <section className="produto-stepper">
      <div className="produto-stepper-header">
        <div>
          <span>Cadastro Enterprise</span>
          <h3>
            Etapa {etapaAtual.numero} de {ETAPAS.length}
          </h3>
          <p>{etapaAtual.descricao}</p>
        </div>

        <div className="produto-stepper-percentual">
          <strong>{Math.round(progresso)}%</strong>
          <span>completo</span>
        </div>
      </div>

      <div className="produto-stepper-barra">
        <div
          className="produto-stepper-barra-preenchida"
          style={{
            width: `${Math.min(100, Math.max(0, progresso))}%`,
          }}
        />
      </div>

      <div className="produto-stepper-etapas">
        {ETAPAS.map((etapa, index) => {
          const ativa = etapa.id === abaCadastro;
          const concluida = etapasConcluidas.includes(etapa.id);
          const anterior = index < etapaAtualIndex;

          return (
            <button
              key={etapa.id}
              type="button"
              className={[
                "produto-stepper-item",
                ativa ? "active" : "",
                concluida || anterior ? "completed" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setAbaCadastro(etapa.id)}
            >
              <div className="produto-stepper-numero">
                {concluida || anterior ? "✓" : etapa.numero}
              </div>

              <div>
                <strong>{etapa.titulo}</strong>
                <span>{etapa.descricao}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default ProdutoStepper;