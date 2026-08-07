"use strict";

/**
 * ============================================================
 * Registro oficial dos motores do ERP
 * ============================================================
 */

class CoreRegistry {

    constructor() {
        this.modules = new Map();
    }

    registrar(nome, modulo) {

        this.modules.set(nome, modulo);

    }

    obter(nome) {

        return this.modules.get(nome);

    }

    listar() {

        return Array.from(this.modules.keys());

    }

    existe(nome) {

        return this.modules.has(nome);

    }

}

module.exports = new CoreRegistry();