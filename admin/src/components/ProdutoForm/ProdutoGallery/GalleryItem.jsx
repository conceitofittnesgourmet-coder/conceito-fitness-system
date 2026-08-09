import { useSortable } from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

export default function GalleryItem({

    image,

    index,

    onPrincipal,

    onRemover,

    onLegenda,

    onAlt

}) {

    const {

    attributes,

    listeners,

    setNodeRef,

    transform,

    transition

} = useSortable({

    id: image.id

});

const style = {

    transform: CSS.Transform.toString(transform),

    transition

};

 
    return (

    <div

    ref={setNodeRef}

    style={style}

    {...attributes}

    {...listeners}

    className="gallery-item"

>

        <div className="gallery-image">

            <img
                src={image.preview}
                alt={image.nome || "Produto"}
            />

            {

                image.principal && (

                    <span className="gallery-principal">

                        ⭐ Principal

                    </span>

                )

            }

        </div>

        <div className="gallery-info">

    <strong>

        {image.nome}

    </strong>

    <small>

        {(image.tamanho / 1024 / 1024).toFixed(2)} MB

    </small>

    <small>

        {image.tipo}

    </small>

    <label>

        Legenda

    </label>

    <input

        type="text"

        value={image.legenda}

        onChange={(e) =>

    onLegenda(

        e.target.value

    )

}

        placeholder="Ex.: Bolo de Cacau"

    />

    <label>

        Texto Alternativo (ALT)

    </label>

    <input

        type="text"

        value={image.alt}

        onChange={(e) =>

    onAlt(

        e.target.value

    )

}

        placeholder="Descrição da imagem"

    />

</div>

        <div className="gallery-actions">

            <button

                type="button"

                onClick={onPrincipal}

            >

                Definir Principal

            </button>

            <button

                type="button"

                onClick={onRemover}

            >

                Excluir

            </button>

        </div>

    </div>

);

}