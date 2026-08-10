import axios from "axios";

export async function consultarCEP(cep) {

    const somenteNumeros = String(cep || "").replace(/\D/g, "");

    if (somenteNumeros.length !== 8) {
        throw new Error("CEP inválido.");
    }

    const { data } = await axios.get(
        `https://viacep.com.br/ws/${somenteNumeros}/json/`
    );

    if (data.erro) {
        throw new Error("CEP não encontrado.");
    }

    return {
        cep: data.cep,
        logradouro: data.logradouro,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.localidade,
        uf: data.uf,
        codigoMunicipioIbge: data.ibge,
    };
}