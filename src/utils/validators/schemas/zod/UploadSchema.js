// src/utils/validators/schemas/zod/UploadSchema.js

import {
    z
} from 'zod';

// Configurações de dimensões por tipo de mídia
const DIMENSOES_POR_TIPO = {
    capa: {
        altura: 720,
        largura: 1280
    },
    carrossel: {
        altura: 720,
        largura: 1280
    },
    video: {
        altura: 720,
        largura: 1280
    }
};

// Configurações de tamanho máximo por tipo (em MB)
const TAMANHO_MAXIMO_MB = {
    capa: 5,
    carrossel: 5,
    video: 25
};

// Schema base para validação de arquivo
const ArquivoBaseSchema = z.object({
    fieldname: z.string().optional(),
    originalname: z.string().min(1, 'Nome original do arquivo é obrigatório'),
    encoding: z.string().optional(),
    size: z.number()
        .gt(0, 'O tamanho do arquivo deve ser maior que zero')
}).passthrough();

// Schema específico para imagens (capa/carrossel)
const ImagemUploadSchema = (tipo) => ArquivoBaseSchema.extend({
    mimetype: z.enum(['image/jpeg', 'image/jpg', 'image/png'], {
        message: 'Formato de imagem inválido. Permitidos: JPEG, JPG, PNG'
    }),
    size: z.number()
        .gt(0, 'O tamanho do arquivo deve ser maior que zero')
        .lte(TAMANHO_MAXIMO_MB[tipo] * 1024 * 1024,
            `O arquivo não pode ser maior que ${TAMANHO_MAXIMO_MB[tipo]}MB`)
}).refine((file) => {
    const extensaoValida = /\.(jpg|jpeg|png)$/i.test(file.originalname);
    return extensaoValida;
}, {
    message: 'Extensão de arquivo inválida. Use .jpg, .jpeg ou .png'
});

// Schema específico para vídeos
const VideoUploadSchema = ArquivoBaseSchema.extend({
    mimetype: z.enum(['video/mp4'], {
        message: 'Formato de vídeo inválido. Permitido apenas: MP4'
    }),
    size: z.number()
        .gt(0, 'O tamanho do arquivo deve ser maior que zero')
        .lte(TAMANHO_MAXIMO_MB.video * 1024 * 1024,
            `O arquivo não pode ser maior que ${TAMANHO_MAXIMO_MB.video}MB`)
}).refine((file) => {
    const extensaoValida = /\.mp4$/i.test(file.originalname);
    return extensaoValida;
}, {
    message: 'Extensão de arquivo inválida. Use .mp4'
});

// Schema para validação de dimensões após processamento com Sharp
const DimensoesSchema = (tipo) => z.object({
    altura: z.number().refine((altura) => {
        return altura === DIMENSOES_POR_TIPO[tipo].altura;
    }, {
        message: `Altura inválida. Esperado: ${DIMENSOES_POR_TIPO[tipo].altura}px`
    }),
    largura: z.number().refine((largura) => {
        return largura === DIMENSOES_POR_TIPO[tipo].largura;
    }, {
        message: `Largura inválida. Esperado: ${DIMENSOES_POR_TIPO[tipo].largura}px`
    })
});

// Schemas específicos por tipo de mídia
const CapaUploadSchema = ImagemUploadSchema('capa');
const CarrosselUploadSchema = ImagemUploadSchema('carrossel');
const VideoUploadBaseSchema = VideoUploadSchema;

// Schema para array de arquivos de carrossel
const CarrosselMultiploSchema = z.array(CarrosselUploadSchema)
    .min(1, 'Pelo menos uma imagem é necessária para o carrossel')
    .max(10, 'Máximo de 10 imagens permitidas no carrossel');

// Schema para validação de parâmetros da rota
const ParametrosUploadSchema = z.object({
    id: z.string().min(1, 'ID do evento é obrigatório'),
    tipo: z.enum(['capa', 'carrossel', 'video'], {
        message: 'Tipo de mídia inválido. Valores permitidos: capa, carrossel, video'
    })
});

// Schema para validação de query parameters de listagem
const QueryListagemSchema = z.object({
    tipo: z.enum(['capa', 'carrossel', 'video']).optional()
}).passthrough();

// Função helper para validar arquivo baseado no tipo
const validarArquivoPorTipo = (file, tipo) => {
    switch (tipo) {
        case 'capa':
            return CapaUploadSchema.parse(file);
        case 'carrossel':
            return CarrosselUploadSchema.parse(file);
        case 'video':
            return VideoUploadBaseSchema.parse(file);
        default:
            throw new Error(`Tipo de mídia não suportado: ${tipo}`);
    }
};

// Função helper para validar dimensões baseado no tipo
const validarDimensoesPorTipo = (metadata, tipo) => {
    return DimensoesSchema(tipo).parse({
        altura: metadata.height,
        largura: metadata.width
    });
};

// Função helper para obter configurações por tipo
const obterConfigTipo = (tipo) => ({
    dimensoes: DIMENSOES_POR_TIPO[tipo],
    tamanhoMaximoMB: TAMANHO_MAXIMO_MB[tipo]
});

export {
    CapaUploadSchema,
    CarrosselUploadSchema,
    VideoUploadBaseSchema,
    CarrosselMultiploSchema,
    ParametrosUploadSchema,
    QueryListagemSchema,
    DimensoesSchema,
    validarArquivoPorTipo,
    validarDimensoesPorTipo,
    obterConfigTipo,
    DIMENSOES_POR_TIPO,
    TAMANHO_MAXIMO_MB
};