const Empresa =
require("../models/empresa");

const Pedido =
require("../models/pedido");

exports.dashboardMaster =
async (req, res) => {

  try {

    const empresas =
      await Empresa.countDocuments();





    const pedidos =
      await Pedido.countDocuments();





    const empresasAtivas =
      await Empresa.countDocuments({

        ativa:true

      });





    res.json({

      empresas,

      pedidos,

      empresasAtivas

    });

  } catch (error) {

    console.log(error);





    res.status(500).json({

      message:
        error.message

    });

  }

};