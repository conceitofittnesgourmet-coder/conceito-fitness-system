export default function IngredienteRow({

    item,

    index,

    remover,

    atualizar,

    produtos

}) {

    return(

        <div
            style={{
                display:"grid",
                gridTemplateColumns:"3fr 1fr 1fr 80px",
                gap:10,
                marginBottom:10
            }}
        >

            <select

    value={item.produto}

    onChange={(e) =>

    atualizar(

        index,

        "produto",

        e.target.value

    )

}
>

    <option value="">
        Selecione...
    </option>

    {produtos.map((produto) => (

        <option
            key={produto._id}
            value={produto._id}
        >

            {produto.nome}

        </option>

    ))}

</select>

            <input

    type="number"

    value={item.quantidade}

    onChange={(e)=>

        atualizar(

            index,

            "quantidade",

            Number(e.target.value)

        )

    }

/>

            <select

    value={item.unidade}

    onChange={(e)=>

        atualizar(

            index,

            "unidade",

            e.target.value

        )

    }

>

    <option value="g">g</option>

    <option value="kg">kg</option>

    <option value="ml">ml</option>

    <option value="l">l</option>

    <option value="un">un</option>

</select>

            <button
                onClick={()=>remover(index)}
            >

                Remover

            </button>

        </div>

    );

}