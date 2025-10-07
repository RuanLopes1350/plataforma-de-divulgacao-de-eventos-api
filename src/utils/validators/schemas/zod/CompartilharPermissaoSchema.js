import { z } from 'zod';

export const CompartilharPermissaoSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  permissao: z.enum(['editar']).optional().default('editar'),
  expiraEm: z.string().optional().refine(val => {
    if (!val) return false;
    const d = new Date(val);
    return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
  }, { message: 'expiraEm deve ser uma data futura no formato ISO' })
});

export default CompartilharPermissaoSchema;
