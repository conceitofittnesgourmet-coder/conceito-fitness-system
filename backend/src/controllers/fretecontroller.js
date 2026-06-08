const ORIGEM_LOJA_COORDENADAS = {
  lat: -23.7646,
  lon: -53.3203,
};

async function buscarCoordenadas(endereco) {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: endereco,
      format: "json",
      limit: "1",
      countrycodes: "br",
    });

  const response = await fetch(url, {
  headers: {
    "User-Agent": "ConceitoFitnessGourmet/1.0",
  },
});

console.log("URL CONSULTADA:");
console.log(url);

console.log("STATUS:");
console.log(response.status);

const data = await response.json();

console.log("RESPOSTA NOMINATIM:");
console.log(JSON.stringify(data, null, 2));

  if (!data || data.length === 0) {
    return null;
  }

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
  };
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

    const origem = ORIGEM_LOJA_COORDENADAS;

    const destino = await buscarCoordenadas(
      `${endereco}, Umuarama, PR, Brasil`
    );

    if (!origem || !destino) {
      return res.status(404).json({
        success: false,
        message: "Não conseguimos localizar esse endereço.",
      });
    }

    const rotaUrl =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origem.lon},${origem.lat};${destino.lon},${destino.lat}` +
      `?overview=false`;

    const rotaResponse = await fetch(rotaUrl);
    const rotaData = await rotaResponse.json();

    if (!rotaData.routes || rotaData.routes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Não foi possível calcular a rota.",
      });
    }

    const distanciaKm = rotaData.routes[0].distance / 1000;

    const kmAdicional = Math.max(0, Math.ceil(distanciaKm - 5));

    const frete =
      distanciaKm <= 5
        ? 10
        : 10 + kmAdicional * 1.5;

    return res.json({
      success: true,
      distanciaKm: Number(distanciaKm.toFixed(2)),
      frete: Number(frete.toFixed(2)),
    });
  } catch (error) {
    console.log("ERRO CALCULAR FRETE:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao calcular frete.",
    });
  }
};