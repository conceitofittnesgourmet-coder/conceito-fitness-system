const Estoque =
require("../models/estoque");

exports.listarEstoque =
async (req, res) => {

  try {

    const itens =
      await Estoque.find();





    const alertas =

      itens.filter(

        (item) =>

          item.quantidade <=
          item.minimo

      );





    res.json({

      itens,

      alertas

    });

  } catch (error) {

    console.log(error);





    res.status(500).json({

      message:
        error.message

    });

  }

};