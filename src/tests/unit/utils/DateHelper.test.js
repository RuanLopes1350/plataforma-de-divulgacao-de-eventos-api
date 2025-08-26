// src/tests/unit/utils/DateHelper.test.js

import DateHelper from '../../../utils/DateHelper';

describe('DateHelper', () => {
  describe('formatDate', () => {
    it('deve formatar data para o formato en-US', () => {
      // Data: 15 de março de 2023
      const data = new Date(2023, 2, 15);
      
      // No formato en-US: 3/15/2023
      const resultado = DateHelper.formatDate(data);
      
      expect(resultado).toBe('3/15/2023');
    });

    it('deve formatar string de data válida', () => {
      const dataString = '2023-04-20T10:30:00Z';
      const resultado = DateHelper.formatDate(dataString);
      
      // Assume formato local en-US: 4/20/2023
      expect(resultado).toBe('4/20/2023');
    });

    it('deve lidar com diferentes formatos de entrada', () => {
      const data = new Date(2023, 0, 1);
      const resultado = DateHelper.formatDate(data);
      
      // Formato local en-US: 1/1/2023
      expect(resultado).toBe('1/1/2023');
    });
  });
});