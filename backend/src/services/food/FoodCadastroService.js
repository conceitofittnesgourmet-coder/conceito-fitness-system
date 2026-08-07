function normalizarNumero(valor, padrao = 0) {
    const numero = Number(String(valor ?? "").replace(",", "."));
    return Number.isFinite(numero) ? numero : padrao;
}

function normalizarBoolean(valor, padrao = false) {
    if (valor === undefined || valor === null) return padrao;
    if (typeof valor === "boolean") return valor;

    const texto = String(valor).toLowerCase().trim();

    return [
        "1",
        "true",
        "sim",
        "yes",
        "on"
    ].includes(texto);
}

function normalizarNutricional(dados = {}) {

    return {

        porcaoGramas:
            normalizarNumero(dados.porcaoGramas,100),

        energia:
            normalizarNumero(dados.energia),

        carboidratos:
            normalizarNumero(dados.carboidratos),

        acucaresTotais:
            normalizarNumero(dados.acucaresTotais),

        acucaresAdicionados:
            normalizarNumero(dados.acucaresAdicionados),

        proteinas:
            normalizarNumero(dados.proteinas),

        gordurasTotais:
            normalizarNumero(dados.gordurasTotais),

        gordurasSaturadas:
            normalizarNumero(dados.gordurasSaturadas),

        gordurasTrans:
            normalizarNumero(dados.gordurasTrans),

        fibras:
            normalizarNumero(dados.fibras),

        sodio:
            normalizarNumero(dados.sodio)

    };

}

function normalizarAlergenicos(dados = {}) {

    return {

        contemGluten:
            normalizarBoolean(dados.contemGluten),

        contemLeite:
            normalizarBoolean(dados.contemLeite),

        contemOvos:
            normalizarBoolean(dados.contemOvos),

        contemSoja:
            normalizarBoolean(dados.contemSoja),

        contemCastanhas:
            normalizarBoolean(dados.contemCastanhas),

        contemAmendoim:
            normalizarBoolean(dados.contemAmendoim),

        podeConter:
            String(dados.podeConter || "")

    };

}

function normalizarFoodCore(dados = {}) {

    return {

        calcularAutomaticamente:
            normalizarBoolean(dados.calcularAutomaticamente,true),

        usarTabelaNutricional:
            normalizarBoolean(dados.usarTabelaNutricional,true),

        usarReceita:
            normalizarBoolean(dados.usarReceita,true),

        gerarFichaTecnica:
            normalizarBoolean(dados.gerarFichaTecnica,true),

        gerarRotulo:
            normalizarBoolean(dados.gerarRotulo,true)

    };

}

module.exports = {

    normalizarNutricional,

    normalizarAlergenicos,

    normalizarFoodCore

};