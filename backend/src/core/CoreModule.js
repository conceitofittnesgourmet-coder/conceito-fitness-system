"use strict";

/**
 * ============================================================
 * ERP Conceito Fitness Gourmet
 * Core ERP
 * ------------------------------------------------------------
 * Classe base para todos os motores centrais.
 * ============================================================
 */

class CoreModule {

    constructor(nome) {
        this.nome = nome;
        this.ativo = true;
        this.versao = "1.0.0";
    }

    getNome() {
        return this.nome;
    }

    getVersao() {
        return this.versao;
    }

    estaAtivo() {
        return this.ativo;
    }

    ativar() {
        this.ativo = true;
    }

    desativar() {
        this.ativo = false;
    }

}

module.exports = CoreModule;