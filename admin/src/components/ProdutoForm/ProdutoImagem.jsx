import { FaCloudUploadAlt, FaImage } from "react-icons/fa";

function ProdutoImagem({
  getRootProps,
  getInputProps,
  isDragActive,
  previewCadastro,
}) {
  return (
    <div className="produto-aba-card imagem-grid-produto">
      <div className="premium-box">
        <h3>
          <FaCloudUploadAlt />
          Imagens do Produto
        </h3>

        <div
          {...getRootProps()}
          className={`upload-premium ${isDragActive ? "active" : ""}`}
        >
          <input {...getInputProps()} />
          <FaCloudUploadAlt />
          <strong>Clique ou arraste a imagem aqui</strong>
          <span>PNG, JPG até 5MB</span>
        </div>
      </div>

      <div className="premium-box preview-premium">
        <h3>
          <FaImage />
          Prévia da imagem
        </h3>

        {previewCadastro ? (
          <img src={previewCadastro} alt="Prévia" />
        ) : (
          <div className="empty-preview">
            <FaImage />
            <strong>Nenhuma imagem</strong>
            <span>A imagem do produto aparecerá aqui</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProdutoImagem;