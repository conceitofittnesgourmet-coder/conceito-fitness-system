import GalleryToolbar from "./GalleryToolbar";
import GalleryGrid from "./GalleryGrid";
import "./gallery.css";

export default function Gallery({

    images,

    setImages

}) {

    return (

        <div className="gallery-module">

            <GalleryToolbar

                images={images}

                setImages={setImages}

            />

            {

                images.length === 0 ? (

                    <div className="gallery-empty">

                        Nenhuma imagem adicionada.

                    </div>

                ) : (

                    <GalleryGrid

                        images={images}

                        setImages={setImages}

                    />

                )

            }

        </div>

    );

}