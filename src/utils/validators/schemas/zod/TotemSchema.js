const ExibicaoTotemSchema = z.object({
    exibDia: z.string().refine(val => {
        const diasValidos = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
        const dias = val.split(',').map(d => d.trim().toLowerCase());
        return dias.every(dia => diasValidos.includes(dia));
    }),
    exibManha: z.boolean(),
    exibTarde: z.boolean(), 
    exibNoite: z.boolean(),
    exibInicio: z.date(),
    exibFim: z.date()
});