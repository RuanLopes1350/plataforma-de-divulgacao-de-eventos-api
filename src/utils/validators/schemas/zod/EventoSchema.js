// src/utils/validators/schemas/zod/EventoSchema.js

import { z } from 'zod';
import objectIdSchema from './ObjectIdSchema.js';

// Regex para validação de URLs (completas ou caminhos relativos)
const URL_REGEX = /^(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+|\/[\w\-._~:/?#[\]@!$&'()*+,;=%\/]+)$/;

// Schema de Validação das Mídias
const MidiaSchema = z.object({
    url: z.string().min(1, 'URL da mídia é obrigatória').regex(URL_REGEX, 'URL da mídia inválida'),
    tamanhoMb: z.number().positive('Tamanho deve ser positivo'),
    altura: z.number().positive('Altura deve ser positiva'),
    largura: z.number().positive('Largura deve ser positiva')
})

// Schema de Validação de Evento
const EventoSchemaBase = z.object({
    titulo: z.string().min(1, 'Campo Nome é obrigatório'),
    descricao: z.string().min(1, 'Campo descrição é obrigatório'),
    local: z.string().min(1, 'Campo local é obrigatório'),
    dataEvento: z.coerce.date({ required_error: 'Campo data é obrigatório' }),
    organizador: z.object({
        _id: objectIdSchema,
        nome: z.string().min(1, 'Nome do organizador é obrigatório')
    }),
    linkInscricao: z.string().url('Link de inscrição inválido'),
    tags: z.array(z.string().min(1)).min(1, 'Insira pelo menos uma tag'),
    categoria: z.string().min(1, 'Campo categoria é obrigatório'),
    status: z.enum(['ativo', 'inativo']).default('inativo'),
    midiaVideo: z.array(MidiaSchema).default([]),
    midiaCapa: z.array(MidiaSchema).default([]),
    midiaCarrossel: z.array(MidiaSchema).default([]),
});

const EventoSchema = EventoSchemaBase.refine((data) => {
    // Se status for 'ativo', as mídias são obrigatórias
    if (data.status === 'ativo') {
        return data.midiaVideo.length > 0 && data.midiaCapa.length > 0 && data.midiaCarrossel.length > 0;
    }
    return true;
}, {
    message: 'Eventos ativos devem ter todas as mídias (capa, vídeo e carrossel)',
    path: ['midias']
});

const EventoUpdateSchema = EventoSchemaBase.partial();

export { EventoSchema, EventoUpdateSchema };