import { FaCloudUploadAlt, FaImage } from "react-icons/fa";
import Gallery from "./ProdutoGallery/Gallery";

function ProdutoImagem({

  getRootProps,

  getInputProps,

  isDragActive,

  previewCadastro,

  imagens,

  setImagens,

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

        <div className="premium-box">

    <h3>

        Galeria do Produto

    </h3>

    <Gallery

        images={imagens}

        setImages={setImagens}

    />

</div>

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