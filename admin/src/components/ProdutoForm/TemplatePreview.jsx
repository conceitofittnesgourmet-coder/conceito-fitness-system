function TemplatePreview({
  tipoWizard,
  templatesProduto,
  gruposSelecionados,
}) {
  return (
    <>
      {templatesProduto[tipoWizard]?.length > 0 && (
        <div className="template-preview">
          <h3>Template Inteligente</h3>

          <p>Este tipo de produto normalmente utiliza:</p>

          <div className="template-chips">
            {templatesProduto[tipoWizard].map((item) => (
              <span key={item}>✓ {item}</span>
            ))}
          </div>
        </div>
      )}

      {gruposSelecionados.length > 0 && (
        <div className="template-auto-box">
          <strong>✅ Grupos aplicados automaticamente</strong>
          <p>
            O sistema vinculou {gruposSelecionados.length} grupo(s) ao produto
            com base no tipo escolhido. Você ainda pode ajustar manualmente no
            Construtor Universal.
          </p>
        </div>
      )}
    </>
  );
}

export default TemplatePreview;