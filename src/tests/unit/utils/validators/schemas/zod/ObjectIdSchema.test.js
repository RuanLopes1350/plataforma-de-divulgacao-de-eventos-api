// src/tests/unit/utils/validators/schemas/zod/ObjectIdSchema.test.js

import mongoose from 'mongoose';
import objectIdSchema from '../../../../../../utils/validators/schemas/zod/ObjectIdSchema';

describe('ObjectIdSchema', () => {
    it('deve aceitar um ObjectId válido do MongoDB', () => {
        // Mongoose para gerar um ID válido
        const validId = new mongoose.Types.ObjectId().toString();
        
        const resultado = objectIdSchema.safeParse(validId);
        expect(resultado.success).toBe(true);
        expect(resultado.data).toBe(validId);
    });

    it('deve aceitar uma string hexadecimal de 24 caracteres', () => {
        const validHexId = 'a1b2c3d4e5f67890abcdef12';
        
        const resultado = objectIdSchema.safeParse(validHexId);
        expect(resultado.success).toBe(true);
        expect(resultado.data).toBe(validHexId);
    });

    it('deve rejeitar uma string com menos de 24 caracteres', () => {
        const invalidId = 'a1b2c3d4e5f67890abcde';
        
        const resultado = objectIdSchema.safeParse(invalidId);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].message).toBe('Invalid MongoDB ObjectId');
    });

    it('deve rejeitar uma string com mais de 24 caracteres', () => {
        const invalidId = 'a1b2c3d4e5f67890abcdef1234';
        
        const resultado = objectIdSchema.safeParse(invalidId);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].message).toBe('Invalid MongoDB ObjectId');
    });

    it('deve rejeitar uma string com caracteres não hexadecimais', () => {
        const invalidId = 'g1h2i3j4k5l67890mnopqr12';
        
        const resultado = objectIdSchema.safeParse(invalidId);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].message).toBe('Invalid MongoDB ObjectId');
    });

    it('deve rejeitar valores que não são strings', () => {
        const valores = [null, undefined, 123, {}, [], true];
        
        valores.forEach(valor => {
            const resultado = objectIdSchema.safeParse(valor);
            expect(resultado.success).toBe(false);
        });
    });
});