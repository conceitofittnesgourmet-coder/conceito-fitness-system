const ORIGEM_LOJA =
  "Avenida Paraná, 8455, Shopping Palladium, Umuarama, PR, Brasil";

function calcularValorFrete(distanciaKm) {
  if (distanciaKm <= 5) return 10;

  const kmAdicional = Math.ceil(distanciaKm - 5);
  return 10 + kmAdicional * 1.5;
}

exports.calcularFrete = async (req, res) => {
  try {
    const { endereco } = req.body;

    if (!endereco) {
      return res.status(400).json({
        success: false,
        message: "Endereço é obrigatório.",
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Chave do Google Maps não configurada.",
      });
    }

    const destino = `${endereco}, Umuarama, PR, Brasil`;

    const url = "https://routes.googleapis.com/directions/v2:computeRoutes";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "routes.distanceMeters,routes.duration,routes.localizedValues",
      },
      body: JSON.stringify({
        origin: {
          address: ORIGEM_LOJA,
        },
        destination: {
          address: destino,
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
        languageCode: "pt-BR",
        units: "METRIC",
      }),
    });

    const data = await response.json();

    console.log("GOOGLE ROUTES RESPONSE:");
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok || data.error) {
      return res.status(400).json({
        success: false,
        message: "Erro ao consultar Google Routes.",
        details: data.error?.message || data,
      });
    }

    const rota = data.routes?.[0];

    if (!rota || !rota.distanceMeters) {
      return res.status(404).json({
        success: false,
        message: "Não foi possível calcular a rota para esse endereço.",
      });
    }

    const distanciaKm = rota.distanceMeters / 1000;
    const frete = calcularValorFrete(distanciaKm);

    return res.json({
      success: true,
      distanciaKm: Number(distanciaKm.toFixed(2)),
      distanciaTexto:
        rota.localizedValues?.distance?.text ||
        `${distanciaKm.toFixed(2)} km`,
      duracao: rota.localizedValues?.duration?.text || rota.duration,
      frete: Number(frete.toFixed(2)),
      origem: ORIGEM_LOJA,
      destino,
    });
  } catch (error) {
    console.log("ERRO CALCULAR FRETE GOOGLE ROUTES:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao calcular frete.",
    });
  }
};