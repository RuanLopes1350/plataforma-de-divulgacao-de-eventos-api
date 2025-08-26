// src/utils/Validator.js

import i18n from '../config/i18nConfig.js';

class Validator {
    constructor(locale = 'pt') {
        i18n.setLocale(locale);
        this._erro = null;
    }

    get erro() {
        return this._erro;
    }

    // Método privado que retorna a instância atual para permitir encadeamento
    _validar(condicao, mensagemKey, placeholders = {}) {
        if (this._erro === null && condicao()) {
            let mensagem = i18n.__(`validation.${mensagemKey}`, placeholders);
            this._erro = mensagem;
        }
        return this;
    }

    validarCampoObrigatorio(valor, campoNome) {
        return this._validar(
            () => valor === null || valor === undefined || valor.toString().trim() === '',
            'required',
            { campoNome }
        );
    }

    validarComprimento(valor, min, max, campoNome) {
        return this
            ._validar(
                () => valor === null || valor === undefined || valor.toString().trim() === '',
                'notEmpty',
                { campoNome }
            )
            ._validar(
                () => valor !== null && valor.length < min,
                'minLength',
                { campoNome, min }
            )
            ._validar(
                () => max !== null && valor !== null && valor.length > max,
                'maxLength',
                { campoNome, max }
            );
    }

    validarNomeProprio(nome, campoNome) {
        const nomeProprioRegex = /^[A-Za-zÀ-ú\s.]+$/;
        return this
            ._validar(
                () => nome === null || nome === undefined || nome.trim() === '',
                'required',
                { campoNome }
            )
            ._validar(
                () => nome !== null && !nomeProprioRegex.test(nome),
                'invalidName',
                { campoNome }
            );
    }

    validarTextoSemCaracteresEspeciais(texto, campoNome) {
        const textoRegex = /^[\p{L}0-9\s.\-]+$/u;
        return this
            ._validar(
                () => texto === null || texto === undefined || texto.trim() === '',
                'notEmpty',
                { campoNome }
            )
            ._validar(
                () => texto !== null && !textoRegex.test(texto),
                'invalidSpecialChars',
                { campoNome }
            );
    }

    validarAlfanumerico(valor, campoNome) {
        const alfanumericoRegex = /^[A-Za-z0-9]+$/;
        return this
            ._validar(
                () => valor === null || valor === undefined || valor.toString().trim() === '',
                'required',
                { campoNome }
            )
            ._validar(
                () => valor !== null && !alfanumericoRegex.test(valor),
                'alphanumeric',
                { campoNome }
            );
    }

    validarMatricula(matricula, campoNome = 'Matrícula') {
        return this._validar(
            () => !/^\d{13}$/.test(matricula),
            'invalidMatricula',
            { campoNome }
        );
    }
    
    validarDataFutura(data, campoNome) {
        return this._validar(
            () => new Date(data) <= new Date(),
            'dateMustFuture',
            { campoNome }
        );
    }

    validarURL(url, campoNome) {
        const urlRegex = /^(http|https):\/\/[^ "]+$/;
        return this._validar(
            () => typeof url !== 'string' || !urlRegex.test(url),
            'invalidURL',
            { campoNome }
        );
    }

    validarTamanhoArquivo(valor, max, campoNome) {
        return this._validar(
            () => isNaN(valor) || valor > max,
            'maxFileSize',
            { campoNome, max }
        );
    }

    validarResolucao(altura, largura, alturaEsperada, larguraEsperada, campoNome) {
        return this._validar(
            () => altura != alturaEsperada || largura != larguraEsperada,
            'invalidResolution',
            { campoNome, alturaEsperada, larguraEsperada }
        );
    }

    validarCategoria(valor, categoriasValidas, campoNome) {
        return this._validar(
            () => !categoriasValidas.includes(valor),
            'invalidCategory',
            { campoNome }
        );
    }

    validarArrayNaoVazio(array, campoNome) {
        return this._validar(
            () => !Array.isArray(array) || array.length === 0,
            'arrayNotEmpty',
            { campoNome }
        );
    }

    // Método para validar e retornar a primeira mensagem de erro encontrada
    validar() {
        return this._erro;
    }
}

export default Validator;