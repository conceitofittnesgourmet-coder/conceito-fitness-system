import ImageUpload from "./ImageUpload";

export default function GalleryToolbar({

    images,
    setImages

}) {

    return (

        <div className="gallery-toolbar">

            <h2>

                Galeria de Imagens

            </h2>

            <ImageUpload

                images={images}

                setImages={setImages}

            />

        </div>

    );

}