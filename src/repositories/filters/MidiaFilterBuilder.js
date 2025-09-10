// src/repositories/filters/MidiaFilterBuilder.js

class MidiaFilterBuilder {
    constructor() {
        this.filtros = {};
    }

    comTipo(tipo) {
        if (tipo && ['capa', 'video', 'carrossel'].includes(tipo.toLowerCase())) {
            this.filtros.tipo = tipo.toLowerCase();
        }
        return this;
    }

    aplicar(evento) {
        const resultado = {
            capa: evento.midiaCapa || [],
            video: evento.midiaVideo || [],
            carrossel: evento.midiaCarrossel || []
        };

        // Se há filtro por tipo específico, retorna apenas esse tipo
        if (this.filtros.tipo) {
            const tipoSelecionado = this.filtros.tipo;
            return {
                [tipoSelecionado]: resultado[tipoSelecionado]
            };
        }

        return resultado;
    }

    build() {
        return { ...this.filtros };
    }

    reset() {
        this.filtros = {};
        return this;
    }
}

export default MidiaFilterBuilder;
