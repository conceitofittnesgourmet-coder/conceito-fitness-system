import GalleryItem from "./GalleryItem";
import {

    DndContext,

    closestCenter

} from "@dnd-kit/core";

import {

    SortableContext,

    rectSortingStrategy,

    arrayMove

} from "@dnd-kit/sortable";

export default function GalleryGrid({

    images,
    setImages

}) {

function handleDragEnd(event) {

    const { active, over } = event;

    if (!over) return;

    if (active.id === over.id) return;

    const oldIndex = images.findIndex(

        img => img.id === active.id

    );

    const newIndex = images.findIndex(

        img => img.id === over.id

    );

    const novaLista = arrayMove(

        images,

        oldIndex,

        newIndex

    ).map((img, ordem) => ({

        ...img,

        ordem

    }));

    setImages(novaLista);

}

    return (

    <DndContext

        collisionDetection={closestCenter}

        onDragEnd={handleDragEnd}

    >

        <SortableContext

            items={images.map(img => img.id)}

            strategy={rectSortingStrategy}

        >

            <div className="gallery-grid">

                {

                    images.map((image, index) => (

                        <GalleryItem

    key={image.id}

    image={image}

    index={index}

    onPrincipal={() => {

        setImages(

            images.map((img, i) => ({

                ...img,

                principal: i === index

            }))

        );

    }}

    onRemover={() => {

        const novaLista = images
            .filter((_, i) => i !== index)
            .map((img, ordem) => ({

                ...img,

                ordem

            }));

        if (

            novaLista.length > 0 &&

            !novaLista.some(img => img.principal)

        ) {

            novaLista[0].principal = true;

        }

        setImages(novaLista);

    }}

    onLegenda={(texto) => {

        setImages(

            images.map((img, i) =>

                i === index

                    ? {

                        ...img,

                        legenda: texto

                    }

                    : img

            )

        );

    }}

    onAlt={(texto) => {

        setImages(

            images.map((img, i) =>

                i === index

                    ? {

                        ...img,

                        alt: texto

                    }

                    : img

            )

        );

    }}

/>

                    ))

                }

            </div>

        </SortableContext>

    </DndContext>

);

}