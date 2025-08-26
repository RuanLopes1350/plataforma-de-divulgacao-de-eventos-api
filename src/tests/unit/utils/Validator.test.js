// src/tests/unit/utils/Validator.test.js

jest.mock('../../../config/i18nConfig.js', () => {
  return {
    setLocale: jest.fn(),
    __: jest.fn((key, placeholders) => {
      const translations = {
        'validation.required': '{campoNome} é obrigatório.',
        'validation.notEmpty': '{campoNome} não pode estar vazio.',
        'validation.minLength': '{campoNome} deve ter pelo menos {min} caracteres.',
        'validation.maxLength': '{campoNome} não deve exceder {max} caracteres.',
        'validation.invalidName': '{campoNome} deve conter apenas letras, espaços e acentos.',
        'validation.invalidSpecialChars': '{campoNome} contém caracteres especiais não permitidos.',
        'validation.alphanumeric': '{campoNome} deve conter apenas letras e números.',
        'validation.dateMustFuture': '{campoNome} deve ser uma data futura.',
        'validation.invalidURL': '{campoNome} deve ser uma URL válida.',
        'validation.maxFileSize': '{campoNome} não deve exceder {max}MB.',
        'validation.invalidResolution': '{campoNome} deve ter resolução {alturaEsperada}x{larguraEsperada}.',
        'validation.invalidCategory': '{campoNome} deve ser uma categoria válida.',
        'validation.arrayNotEmpty': '{campoNome} não pode estar vazio.'
      };
      
      let message = translations[key] || key;
      
      if (placeholders) {
        // Substituir placeholders
        Object.keys(placeholders).forEach(placeholder => {
          message = message.replace(`{${placeholder}}`, placeholders[placeholder]);
        });
      }
      
      return message;
    })
  };
}, { virtual: true });

import Validator from '../../../utils/Validator';

describe('Validator', () => {
  let validator;

  beforeEach(() => {
    validator = new Validator();
    jest.clearAllMocks();
  });

  describe('validarCampoObrigatorio', () => {
    it('deve retornar true para valor válido', () => {
      const resultado = validator.validarCampoObrigatorio('teste', 'Campo');

      expect(resultado._erro).toBeNull();
    });

    it('deve retornar false para valor vazio', () => {
      const resultado = validator.validarCampoObrigatorio('', 'Campo');

      expect(resultado._erro).not.toBeNull();
      expect(resultado._erro).toContain('Campo é obrigatório');
    });

    it('deve retornar false para valor null', () => {
      const resultado = validator.validarCampoObrigatorio(null, 'Campo');
      expect(resultado._erro).not.toBeNull();
    });

    it('deve retornar false para valor undefined', () => {
      const resultado = validator.validarCampoObrigatorio(undefined, 'Campo');
      expect(resultado._erro).not.toBeNull();
    });
  });

  describe('validarComprimento', () => {
    it('deve retornar true para comprimento válido', () => {
      const resultado = validator.validarComprimento('teste', 3, 13, 'Campo');
      expect(resultado._erro).toBeNull();
    });

    it('deve retornar false para comprimento abaixo do mínimo', () => {
      const resultado = validator.validarComprimento('ab', 3, 10, 'Campo');
      expect(resultado._erro).not.toBeNull();
      expect(resultado._erro).toContain('Campo deve ter pelo menos 3 caracteres');
    });

    it('deve retornar false para comprimento acima do máximo', () => {
      const resultado = validator.validarComprimento('abcdefghijk', 3, 10, 'Campo');
      expect(resultado._erro).not.toBeNull();
      expect(resultado._erro).toContain('Campo não deve exceder 10 caracteres');
    });
  });

  describe('validarNomeProprio', () => {
    it('deve retornar true para nome próprio válido', () => {
      const resultado = validator.validarNomeProprio('João Silva', 'Nome');
      expect(resultado._erro).toBeNull();
    });

    it('deve retornar false para nome com números', () => {
      const resultado = validator.validarNomeProprio('João123', 'Nome');
      expect(resultado._erro).not.toBeNull();
      expect(resultado._erro).toContain('Nome deve conter apenas letras');
    });

    it('deve retornar false para nome com caracteres especiais', () => {
      const resultado = validator.validarNomeProprio('João@Silva', 'Nome');
      expect(resultado._erro).not.toBeNull();
    });
  });

  describe('validarDataFutura', () => {
    it('deve retornar true para data futura', () => {
      const dataFutura = new Date();
      dataFutura.setDate(dataFutura.getDate() + 10);
      
      const resultado = validator.validarDataFutura(dataFutura, 'Data');
      expect(resultado._erro).toBeNull();
    });

    it('deve retornar false para data passada', () => {
      const dataPassada = new Date();
      dataPassada.setDate(dataPassada.getDate() - 10); 
      
      const resultado = validator.validarDataFutura(dataPassada, 'Data');
      expect(resultado._erro).not.toBeNull();
      expect(resultado._erro).toContain('Data deve ser uma data futura');
    });
  });

  describe('validarURL', () => {
    it('deve retornar true para URL válida', () => {
      const resultado = validator.validarURL('https://example.com', 'URL');
      expect(resultado._erro).toBeNull();
    });

    it('deve retornar false para URL inválida', () => {
      const resultado = validator.validarURL('exemplo.com', 'URL');
      expect(resultado._erro).not.toBeNull();
      expect(resultado._erro).toContain('URL deve ser uma URL válida');
    });
  });

  describe('validarAlfanumerico', () => {
    it('deve retornar true para texto alfanumérico', () => {
      const resultado = validator.validarAlfanumerico('Abc123', 'Campo');
      expect(resultado._erro).toBeNull();
    });

    it('deve retornar false para texto com caracteres especiais', () => {
      const resultado = validator.validarAlfanumerico('Abc@123', 'Campo');
      expect(resultado._erro).not.toBeNull();
      expect(resultado._erro).toContain('Campo deve conter apenas letras e números');
    });
  });

  describe('getter erro', () => {
    it('deve retornar null quando não há erro', () => {

      expect(validator.erro).toBeNull();
    });

    it('deve retornar a mensagem de erro quando há erro', () => {
      validator.validarCampoObrigatorio('', 'Campo');
      expect(validator.erro).not.toBeNull();
      expect(validator.erro).toContain('Campo é obrigatório');
    });
  });

  describe('validarCategoria', () => {
    it('deve retornar true para categoria válida', () => {
      const categoriasValidas = ['esporte', 'cultura', 'educação'];
      const resultado = validator.validarCategoria('esporte', categoriasValidas, 'Categoria');
      expect(resultado._erro).toBeNull();
    });

    it('deve retornar false para categoria inválida', () => {
      const categoriasValidas = ['esporte', 'cultura', 'educação'];
      const resultado = validator.validarCategoria('tecnologia', categoriasValidas, 'Categoria');
      expect(resultado._erro).not.toBeNull();
      expect(resultado._erro).toContain('Categoria deve ser uma categoria válida');
    });
  });

  describe('validarArrayNaoVazio', () => {
    it('deve retornar true para array não vazio', () => {
      const resultado = validator.validarArrayNaoVazio([1, 2, 3], 'Lista');
      expect(resultado._erro).toBeNull();
    });

    it('deve retornar false para array vazio', () => {
      const resultado = validator.validarArrayNaoVazio([], 'Lista');
      expect(resultado._erro).not.toBeNull();
      expect(resultado._erro).toContain('Lista não pode estar vazio');
    });

    it('deve retornar false para valor que não é array', () => {
      const resultado = validator.validarArrayNaoVazio('não é array', 'Lista');
      expect(resultado._erro).not.toBeNull();
      expect(resultado._erro).toContain('Lista não pode estar vazio');
    });
  });

  describe('validar', () => {
    it('deve retornar null quando não há erro', () => {
      const resultado = validator.validar();
      expect(resultado).toBeNull();
    });

    it('deve retornar a mensagem de erro quando há erro', () => {
      validator.validarCampoObrigatorio('', 'Campo');
      const resultado = validator.validar();
      expect(resultado).not.toBeNull();
      expect(resultado).toContain('Campo é obrigatório');
    });

    it('deve manter o primeiro erro encontrado em validações encadeadas', () => {
      validator.validarCampoObrigatorio('', 'Campo1')
              .validarCampoObrigatorio('', 'Campo2');
      
      const resultado = validator.validar();
      expect(resultado).toContain('Campo1');
      expect(resultado).not.toContain('Campo2');
    });
  });

  describe('validarTextoSemCaracteresEspeciais', () => {
  it('deve retornar true para texto sem caracteres especiais', () => {
    const resultado = validator.validarTextoSemCaracteresEspeciais('Texto simples 123', 'Campo');
    expect(resultado._erro).toBeNull();
  });

  it('deve retornar false para texto com caracteres especiais', () => {
    const resultado = validator.validarTextoSemCaracteresEspeciais('Texto@com#caracteres!', 'Campo');
    expect(resultado._erro).not.toBeNull();
    expect(resultado._erro).toContain('Campo contém caracteres especiais não permitidos');
  });

  it('deve retornar false para texto vazio', () => {
    const resultado = validator.validarTextoSemCaracteresEspeciais('', 'Campo');
    expect(resultado._erro).not.toBeNull();
    expect(resultado._erro).toContain('Campo não pode estar vazio');
  });

  it('deve retornar false para texto null ou undefined', () => {
    const resultado1 = validator.validarTextoSemCaracteresEspeciais(null, 'Campo');
    const resultado2 = validator.validarTextoSemCaracteresEspeciais(undefined, 'Campo');
    
    expect(resultado1._erro).not.toBeNull();
    expect(resultado2._erro).not.toBeNull();
  });
});

  describe('validarTamanhoArquivo', () => {
    it('deve retornar true para tamanho de arquivo válido', () => {
      const resultado = validator.validarTamanhoArquivo(2.5, 5, 'Arquivo');
      expect(resultado._erro).toBeNull();
    });

    it('deve retornar false para tamanho de arquivo que excede o máximo', () => {
      const resultado = validator.validarTamanhoArquivo(10, 5, 'Arquivo');
      expect(resultado._erro).not.toBeNull();
      expect(resultado._erro).toContain('Arquivo não deve exceder 5MB');
    });

    it('deve retornar false para valor que não é número', () => {
      const resultado = validator.validarTamanhoArquivo('não é número', 5, 'Arquivo');
      expect(resultado._erro).not.toBeNull();
      expect(resultado._erro).toContain('Arquivo não deve exceder 5MB');
    });
  });

  describe('validarResolucao', () => {
    it('deve retornar true para resolução válida', () => {
      const resultado = validator.validarResolucao(720, 1280, 720, 1280, 'Imagem');
      expect(resultado._erro).toBeNull();
    });

    it('deve retornar false para altura diferente da esperada', () => {
      const resultado = validator.validarResolucao(480, 1280, 720, 1280, 'Imagem');
      expect(resultado._erro).not.toBeNull();
      expect(resultado._erro).toContain('Imagem deve ter resolução 720x1280');
    });

    it('deve retornar false para largura diferente da esperada', () => {
      const resultado = validator.validarResolucao(720, 800, 720, 1280, 'Imagem');
      expect(resultado._erro).not.toBeNull();
      expect(resultado._erro).toContain('Imagem deve ter resolução 720x1280');
    });
  });
});