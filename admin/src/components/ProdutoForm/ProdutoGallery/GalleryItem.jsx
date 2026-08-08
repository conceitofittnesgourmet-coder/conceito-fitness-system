export default function GalleryItem({

    image,

    index,

    images,

    setImages

}) {

    function definirPrincipal() {

        const novaLista = images.map((img, i) => ({

            ...img,

            principal: i === index

        }));

        setImages(novaLista);

    }

    function remover() {

        const novaLista = images.filter(

            (_, i) => i !== index

        );

        if (

            novaLista.length > 0 &&

            !novaLista.some(i => i.principal)

        ) {

            novaLista[0].principal = true;

        }

        setImages(novaLista);

    }

    return (

    <div className="gallery-item">

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

        </div>

        <div className="gallery-actions">

            <button

                type="button"

                onClick={definirPrincipal}

            >

                Definir Principal

            </button>

            <button

                type="button"

                onClick={remover}

            >

                Excluir

            </button>

        </div>

    </div>

);

}