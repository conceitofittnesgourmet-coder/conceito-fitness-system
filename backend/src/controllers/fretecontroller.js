const ORIGEM_LAT = -23.750381;
const ORIGEM_LON = -53.2719;

function calcularValorFrete(distanciaKm) {
  if (distanciaKm <= 5) return 10;

  const kmAdicional = distanciaKm - 5;

  return Number((10 + kmAdicional * 1.5).toFixed(2));
}

async function buscarCoordenadas(endereco) {
  const enderecoCompleto = `${endereco}, Umuarama, Paraná, Brasil`;

  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: enderecoCompleto,
      format: "json",
      limit: "1",
      countrycodes: "br",
    });

  const response = await fetch(url, {
    headers: {
      "User-Agent": "ConceitoFitnessGourmet/1.0 contato@conceitofitgourmet.com.br",
    },
  });

  const contentType =
  response.headers.get("content-type") || "";

if (!response.ok) {
  const texto = await response.text();

  throw new Error(
    `Nominatim respondeu HTTP ${response.status}: ${texto.slice(0, 300)}`
  );
}

if (!contentType.includes("application/json")) {
  const texto = await response.text();

  throw new Error(
    `Nominatim retornou resposta inválida: ${texto.slice(0, 300)}`
  );
}

  const data = await response.json();

  if (!data || data.length === 0) {
    return null;
  }

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
    displayName: data[0].display_name,
  };
}

async function calcularDistanciaRota(destinoLat, destinoLon) {
  const url = `https://router.project-osrm.org/route/v1/driving/${ORIGEM_LON},${ORIGEM_LAT};${destinoLon},${destinoLat}?overview=false&alternatives=false&steps=false`;

  const response = await fetch(url);
  const contentType =
  response.headers.get("content-type") || "";

if (!response.ok) {
  const texto = await response.text();

  throw new Error(
    `OSRM respondeu HTTP ${response.status}: ${texto.slice(0, 300)}`
  );
}

if (!contentType.includes("application/json")) {
  const texto = await response.text();

  throw new Error(
    `OSRM retornou resposta inválida: ${texto.slice(0, 300)}`
  );
}

const data = await response.json();

  console.log("OSRM RESPONSE:");
  console.log(JSON.stringify(data, null, 2));

  if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
    return null;
  }

  return {
    distanciaKm: data.routes[0].distance / 1000,
    duracaoMin: data.routes[0].duration / 60,
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

    const coordenadasDestino = await buscarCoordenadas(endereco);

    console.log("DESTINO ENCONTRADO:");
    console.log(coordenadasDestino);

    if (!coordenadasDestino) {
      return res.status(404).json({
        success: false,
        message:
          "Não conseguimos localizar esse endereço. Tente informar rua, número, bairro e cidade.",
      });
    }

    const rota = await calcularDistanciaRota(
      coordenadasDestino.lat,
      coordenadasDestino.lon
    );

    if (!rota) {
      return res.status(404).json({
        success: false,
        message: "Não foi possível calcular a rota para esse endereço.",
      });
    }

    const distanciaKm = Number(rota.distanciaKm.toFixed(2));
    const duracaoMin = Math.ceil(rota.duracaoMin);
    const frete = Number(calcularValorFrete(distanciaKm).toFixed(2));

    return res.json({
      success: true,
      distanciaKm,
      distanciaTexto: `${distanciaKm} km`,
      duracao: `${duracaoMin} min`,
      frete,
      origem: {
        nome: "Shopping Palladium Umuarama",
        lat: ORIGEM_LAT,
        lon: ORIGEM_LON,
      },
      destino: {
        enderecoInformado: endereco,
        enderecoEncontrado: coordenadasDestino.displayName,
        lat: coordenadasDestino.lat,
        lon: coordenadasDestino.lon,
      },
    });
  } catch (error) {
    console.log("ERRO CALCULAR FRETE OPENSTREETMAP:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao calcular frete.",
    });
  }
};