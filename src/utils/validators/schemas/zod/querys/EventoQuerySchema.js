import { z } from "zod";
import mongoose from 'mongoose';

export const EventoIdSchema = z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
  message: "ID inválido",
});

export const EventoQuerySchema = z.object({
  titulo: z
    .string()
    .optional()
    .transform((val) => val?.trim()),

  descricao: z
    .string()
    .optional()
    .transform((val) => val?.trim()),

  local: z
    .string()
    .optional()
    .transform((val) => val?.trim()),

  categoria: z
    .string()
    .optional()
    .transform((val) => val?.trim()),

  // Campo de filtragem por tags (array de strings)
  tags: z
    .string()
    .optional()
    .transform((val) => val?.split(',').map(tag => tag.trim())),

  // Campo para filtrar por tipo específico de evento (usado pelo totem)
  tipo: z
    .string()
    .optional()
    .refine(
      (value) => !value || ["historico", "futuro", "ativo"].includes(value),
      { message: "Tipo deve ser 'historico', 'futuro' ou 'ativo'" }
    ),

  // Campo de filtragem por status
  status: z
    .union([
      z.string()
        .refine(
          (value) => !value || ["ativo", "inativo"].includes(value),
          { message: "Status deve ser 'ativo' ou 'inativo'" }
        ),
      z.array(
        z.string().refine(
          (value) => ["ativo", "inativo"].includes(value),
          { message: "Cada status deve ser 'ativo' ou 'inativo'" }
        )
      )
    ])
    .optional(),

  // Campo para filtragem por data
  dataInicio: z
    .string()
    .optional()
    .refine(
      (value) => !value || !isNaN(new Date(value).getTime()),
      { message: "Data de início inválida" }
    ),

  dataFim: z
    .string()
    .optional()
    .refine(
      (value) => !value || !isNaN(new Date(value).getTime()),
      { message: "Data de fim inválida" }
    ),

  // Campos para paginação
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => Number.isInteger(val) && val > 0, {
      message: "Page deve ser um número inteiro maior que 0",
    }),

  limite: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => Number.isInteger(val) && val > 0 && val <= 100, {
      message: "Limite deve ser um número inteiro entre 1 e 100",
    })
});
