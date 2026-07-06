const { gerarBI } = require("../services/biService");

exports.dashboard = async (req, res) => {
  try {
    const bi = await gerarBI();

    return res.status(200).json({
      success: true,
      dashboard: bi,
    });
  } catch (error) {
    console.log("ERRO DASHBOARD:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};