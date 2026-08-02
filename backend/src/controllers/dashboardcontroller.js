const { gerarBI } = require("../services/biService");
const { gerarDashboardExecutivo } = require("../services/DashboardExecutivoService");

exports.dashboard = async (req, res) => {
  try {
    const bi = await gerarBI({ empresa: req.usuario?.empresa || req.admin?.empresa });
    return res.status(200).json({ success: true, dashboard: bi });
  } catch (error) {
    console.log("ERRO DASHBOARD:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.dashboardExecutivo = async (req, res) => {
  try {
    const dashboard = await gerarDashboardExecutivo({ dias: req.query.dias });
    return res.status(200).json({ success: true, dashboard });
  } catch (error) {
    console.log("ERRO DASHBOARD EXECUTIVO:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
