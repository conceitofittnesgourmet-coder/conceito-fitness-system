import DadosNutricionaisProduto from "./DadosNutricionaisProduto";
import AlergenosProduto from "./AlergenosProduto";
import SelosProduto from "./SelosProduto";

function ProdutoNutricional({
  informacoesNutricionais,
  setInformacoesNutricionais,
  alergenos,
  setAlergenos,
  selos,
  setSelos,
}) {
  return (
    <div className="produto-aba-card">
      <DadosNutricionaisProduto
        dados={informacoesNutricionais}
        setDados={setInformacoesNutricionais}
      />

      <AlergenosProduto
        alergenos={alergenos}
        setAlergenos={setAlergenos}
      />

      <SelosProduto selos={selos} setSelos={setSelos} />
    </div>
  );
}

export default ProdutoNutricional;