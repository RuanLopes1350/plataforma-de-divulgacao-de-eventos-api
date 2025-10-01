// src/utils/validators/schemas/zod/EventoSchema.js

import {
    z
} from "zod";
import objectIdSchema from "./ObjectIdSchema.js";

// Regex para validação de URLs (completas ou caminhos relativos)
const URL_REGEX = /^(https?:\/\/[\w\-._~:\/?#[\]@!$&'()*+,;=%]+|\/[\w\-._~:\/?#[\]@!$&'()*+,;=%\/]+)$/;

// Schema de validação para upload de imagens e vídeos
const midiaUploadValidationSchema = z.object({
    fieldname: z.string().optional(),
    originalname: z.string()
        .optional()
        .refine((val) => !val || /\.(jpg|jpeg|png|webp|mp4)$/i.test(val), {
            message: 'O arquivo deve ter extensão válida para imagem (.jpg, .jpeg, .png, .webp) ou vídeo (.mp4)'
        }),
    encoding: z.string().optional(),
    mimetype: z.union([
        // Tipos de imagem
        z.literal('image/jpeg'),
        z.literal('image/jpg'),
        z.literal('image/png'),
        z.literal('image/webp'),
        // Tipos de vídeo
        z.literal('video/mp4')
    ], {
        message: 'O arquivo enviado não é uma mídia válida. Por favor, envie um arquivo de imagem (JPEG, PNG, WebP) ou vídeo (MP4).'
    }),
    buffer: z.instanceof(Buffer, {
            message: 'O buffer do arquivo é inválido.'
        })
        .refine((buffer) => buffer.length > 0, {
            message: 'O arquivo de mídia não pode estar vazio.'
        }),
    size: z.number()
        .gt(0, "O tamanho do arquivo deve ser maior que zero.")
        .lte(200 * 1024 * 1024, "O arquivo não pode ser maior que 200MB.")
}).passthrough();

// Schema de Validação das Mídias
const MidiaSchema = z.object({
    midiTipo: z.string().min(1, 'Tipo da mídia é obrigatório'),
    midiLink: z.string().min(1, 'Link da mídia é obrigatório').regex(URL_REGEX, 'Link da mídia inválido')
});

// Schema principal do Evento
const EventoSchema = z.object({
        titulo: z.string().min(1, 'Campo titulo é obrigatório'),
        descricao: z.string().min(1, 'Campo descrição é obrigatório'),
        local: z.string().min(1, 'Campo local é obrigatório'),
        dataInicio: z.coerce.date({
            required_error: 'Campo dataInicio é obrigatório'
        }),
        dataFim: z.coerce.date({
            required_error: 'Campo dataFim é obrigatório'
        }),
        link: z.string()
            .optional()
            .refine((v) => v === undefined || v === '' || URL_REGEX.test(v), {
                message: 'Link inválido'
            }),
        organizador: z.object({
            _id: objectIdSchema,
            nome: z.string().min(1, 'Nome do organizador é obrigatório')
        }),
        tags: z.array(z.string().min(1, 'Tag não pode ser vazia'))
            .optional()
            .default([])
            .refine((tags) => !tags || tags.length === 0 || tags.every(tag => tag.trim().length > 0), {
                message: 'Tags não podem ser vazias'
            }),
        categoria: z.enum([
            'academico',
            'palestra',
            'workshop',
            'seminario',
            'congresso',
            'minicurso',
            'cultural',
            'esportivo',
            'social',
            'cientifico',
            'extensao',
            'pesquisa',
            'feira',
            'mostra',
            'competicao',
            'formatura',
            'vestibular',
            'enem',
            'institucional',
            'outros'
        ], {
            errorMap: () => ({
                message: 'A categoria deve ser uma das opções válidas disponíveis.'
            }),
        }),
        cor: z.number()
            .int()
            .nonnegative()
            .optional(),
        animacao: z.number()
            .int()
            .nonnegative()
            .optional(),
        status: z.number()
            .int()
            .optional(),
        midia: z.array(MidiaSchema)
            .default([])
            .optional(),
        qrcode: MidiaSchema
            .optional(),
    })
    .refine((data) => {
        // Validação: dataFim deve ser igual ou posterior a dataInicio
        if (data.dataInicio && data.dataFim) {
            const inicio = new Date(data.dataInicio).getTime();
            const fim = new Date(data.dataFim).getTime();
            return fim >= inicio;
        }
        return true;
    }, {
        message: 'dataFim deve ser igual ou posterior a dataInicio',
        path: ['dataFim']
    });

// Schema para atualizações (todos os campos opcionais exceto organizador)
const EventoUpdateSchema = z.object({
    titulo: z.string().min(1, 'Campo titulo é obrigatório').optional(),
    descricao: z.string().min(1, 'Campo descrição é obrigatório').optional(),
    local: z.string().min(1, 'Campo local é obrigatório').optional(),
    dataInicio: z.coerce.date().optional(),
    dataFim: z.coerce.date().optional(),
    link: z.string()
        .optional()
        .refine((v) => v === undefined || v === '' || URL_REGEX.test(v), {
            message: 'Link inválido'
        }),
    tags: z.array(z.string().min(1, 'Tag não pode ser vazia')).optional(),
    categoria: z.enum([
        'academico', 'palestra', 'workshop', 'seminario', 'congresso', 'minicurso',
        'cultural', 'esportivo', 'social', 'cientifico', 'extensao', 'pesquisa',
        'feira', 'mostra', 'competicao', 'formatura', 'vestibular', 'enem',
        'institucional', 'outros'
    ]).optional(),
    cor: z.number().int().nonnegative().optional(),
    animacao: z.number().int().nonnegative().optional(),
    status: z.number().int().optional(),
    midia: z.array(MidiaSchema).optional(),
}).refine((data) => {
    if (data.dataInicio && data.dataFim) {
        return new Date(data.dataFim).getTime() >= new Date(data.dataInicio).getTime();
    }
    return true;
}, {
    message: 'dataFim deve ser igual ou posterior a dataInicio',
    path: ['dataFim']
});

export {
    EventoSchema,
    EventoUpdateSchema,
    midiaUploadValidationSchema
};