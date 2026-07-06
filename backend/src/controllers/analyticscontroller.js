const { gerarBI } = require("../services/biService");

exports.getAnalytics = async (req, res) => {
  try {
    const bi = await gerarBI();

    return res.json(bi);
  } catch (error) {
    console.log("ERRO ANALYTICS:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};