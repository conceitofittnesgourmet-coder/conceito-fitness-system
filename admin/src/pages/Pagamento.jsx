import {

  useState

} from "react";

import api
from "../services/api";

function Pagamento() {

  const [pix,
    setPix] =
    useState(null);





  async function
  gerarPix() {

    try {

      const response =
        await api.post(

          "/pagamento/pix",

          {

            total:49.90,

            cliente:
              "Cliente"

          }

        );





      setPix(
        response.data.pix
      );

    } catch (error) {

      console.log(error);

    }

  }





  return (

    <div className="pagamento">

      <h1>
        Pagamento PIX
      </h1>





      <button
        onClick={gerarPix}
      >

        Gerar PIX

      </button>





      {

        pix && (

          <div
            className="pix-box"
          >

            <img

              src={
                pix.qr_code_base64
              }

              alt="PIX"

            />





            <textarea

              value={
                pix.qr_code
              }

              readOnly

            />

          </div>

        )

      }

    </div>

  );

}

export default Pagamento;