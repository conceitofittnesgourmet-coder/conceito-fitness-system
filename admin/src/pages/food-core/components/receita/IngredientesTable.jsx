import IngredienteRow from "./IngredienteRow";

export default function IngredientesTable({

    ingredientes,

    setIngredientes,

    produtos

}) {

    function adicionar() {

        setIngredientes([
            ...ingredientes,
            {
                produto: "",
                quantidade: 0,
                unidade: "g"
            }
        ]);

    }

    function remover(index) {

        setIngredientes(
            ingredientes.filter((_, i) => i !== index)
        );

    }

    function atualizar(index, campo, valor) {

    const lista = [...ingredientes];

    lista[index] = {

        ...lista[index],

        [campo]: valor

    };

    setIngredientes(lista);

}

    return (

        <div className="foodcore-card">

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20
                }}
            >

                <h2>Ingredientes</h2>

                <button
                    onClick={adicionar}
                >
                    + Adicionar
                </button>

            </div>

            {

                ingredientes.length === 0

                &&

                <p>Nenhum ingrediente cadastrado.</p>

            }

            {

                ingredientes.map((item,index)=>(

                    <IngredienteRow
    key={index}
    item={item}
    index={index}
    remover={remover}
    atualizar={atualizar}
    produtos={produtos}
/>

                ))

            }

        </div>

    );

}