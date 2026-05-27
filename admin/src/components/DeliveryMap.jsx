import {

  MapContainer,

  Marker,

  Popup,

  TileLayer

} from "react-leaflet";

function DeliveryMap({

  entregadores

}) {

  return (

    <MapContainer

      center={[-25.429,
      -49.271]}

      zoom={13}

      style={{

        height:"500px",

        width:"100%",

        borderRadius:"24px"

      }}

    >

      <TileLayer

        attribution='&copy; OpenStreetMap'

        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

      />





      {

        entregadores.map(

          (entregador) => (

            <Marker

              key={entregador.id}

              position={[

                entregador.lat,

                entregador.lng

              ]}

            >

              <Popup>

                🚴
                {entregador.nome}

              </Popup>

            </Marker>

          )

        )

      }

    </MapContainer>

  );

}

export default DeliveryMap;