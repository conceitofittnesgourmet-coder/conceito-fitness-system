import GalleryItem from "./GalleryItem";

export default function GalleryGrid({

    images,
    setImages

}) {

    return (

        <div className="gallery-grid">

            {

                images.map((image, index) => (

                    <GalleryItem

                        key={index}

                        image={image}

                        index={index}

                        images={images}

                        setImages={setImages}

                    />

                ))

            }

        </div>

    );

}