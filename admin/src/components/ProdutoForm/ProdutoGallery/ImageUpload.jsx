export default function ImageUpload({

    images,
    setImages

}) {

    function handleFiles(e) {

        const files = Array.from(e.target.files);

        const novos = files.map((file, index) => ({

    id: crypto.randomUUID(),

    file,

    nome: file.name,

    tamanho: file.size,

    tipo: file.type,

    preview: URL.createObjectURL(file),

    principal:

        images.length === 0 && index === 0,

    ordem:

        images.length + index,

    legenda: "",

    alt: "",

    upload: false

}));

        setImages([

            ...images,

            ...novos

        ]);

    }

    return (

        <label className="gallery-upload">

            +

            <input

                hidden

                multiple

                type="file"

                accept="image/*"

                onChange={handleFiles}

            />

        </label>

    );

}