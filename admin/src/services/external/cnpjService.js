import axios from "axios";

export async function consultarCNPJ(cnpj) {

    const numero = String(cnpj || "").replace(/\D/g, "");

    if (numero.length !== 14) {
        throw new Error("CNPJ inválido.");
    }

    const { data } = await axios.get(
        `https://brasilapi.com.br/api/cnpj/v1/${numero}`
    );

    return data;
}