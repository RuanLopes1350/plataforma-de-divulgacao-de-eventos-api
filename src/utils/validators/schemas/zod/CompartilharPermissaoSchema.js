import { z } from 'zod';

export const CompartilharPermissaoSchema = z.object({
  email: z.string().email({ message: 'Email inválido' })
});

export default CompartilharPermissaoSchema;
