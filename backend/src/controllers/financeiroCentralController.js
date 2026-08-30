const {
  gerarResumoFinanceiro,
} =
  require("../services/financeiroMetricsService");


exports.resumo = async (
  req,
  res
) => {
  try {

    const resumo =
      await gerarResumoFinanceiro(
        req
      );


    return res.json({
      success: true,

      ...resumo,
    });

  } catch (error) {

    console.error(
      "ERRO FINANCEIRO CENTRAL:",
      error
    );


    return res
      .status(500)
      .json({
        success: false,

        message:
          error.message ||
          "Erro ao gerar resumo financeiro.",
      });
  }
};


exports.resumoHoje = async (
  req,
  res
) => {
  try {

    const resumo =
      await gerarResumoFinanceiro(
        req,
        {
          query: {},
        }
      );


    return res.json({
      success: true,

      ...resumo,
    });

  } catch (error) {

    console.error(
      "ERRO RESUMO HOJE:",
      error
    );


    return res
      .status(500)
      .json({
        success: false,

        message:
          error.message ||
          "Erro ao gerar resumo do dia.",
      });
  }
};


exports.resumoMes = async (
  req,
  res
) => {
  try {

    const resumo =
      await gerarResumoFinanceiro(
        req,
        {
          query: {
            periodo: "mes",
          },
        }
      );


    return res.json({
      success: true,

      ...resumo,
    });

  } catch (error) {

    console.error(
      "ERRO RESUMO MES:",
      error
    );


    return res
      .status(500)
      .json({
        success: false,

        message:
          error.message ||
          "Erro ao gerar resumo mensal.",
      });
  }
};