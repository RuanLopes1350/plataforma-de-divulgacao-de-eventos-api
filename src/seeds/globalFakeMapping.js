// /src/seeds/globalFakeMapping.js

import { faker } from "@faker-js/faker";
import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';
import TokenUtil from "../utils/TokenUtil.js";
import loadModels from './loadModels.js';

/**
 * Estrutura de mappings organizada por model.
 */
const fakeMappings = {

  common: {},

  // Mapping específico para o model Usuario

  Usuario: {
    nome: () =>
      faker.person.firstName() +
      " " +
      faker.person.lastName() +
      " " +
      faker.person.lastName(),
    email: () => faker.internet.email(),
    senha: () => faker.internet.password(),
    admin: false,
    status: () => faker.helpers.arrayElement(['ativo', 'inativo']),
    createdAt: () => faker.date.between({ from: '2025-10-01T00:00:00.000Z', to: new Date() }),
    tokenUnico: () => TokenUtil.generateAccessToken(new mongoose.Types.ObjectId().toString()),
    exp_tokenUnico_recuperacao: () => faker.date.future({ minutes: 60 }),
    refreshtoken: () => TokenUtil.generateRefreshToken(new mongoose.Types.ObjectId().toString()),
    accesstoken: () => TokenUtil.generateAccessToken(new mongoose.Types.ObjectId().toString()),
  },

  // Mapping específico para o model Evento

  Evento: {
    titulo: () => faker.company.catchPhrase(),
    descricao: () => faker.lorem.sentence(),
    local: () => faker.location.city(),
    dataInicio: () => faker.date.future(),
    dataFim: () => faker.date.future({ days: 7 }),
    exibDia: () => {
      const diasValidos = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
      const numDias = faker.number.int({ min: 1, max: 3 });
      const diasEscolhidos = faker.helpers.arrayElements(diasValidos, numDias);
      return diasEscolhidos.join(',');
    },
    exibManha: () => faker.datatype.boolean(),
    exibTarde: () => faker.datatype.boolean(),
    exibNoite: () => faker.datatype.boolean(),
    exibInicio: () => faker.date.soon({ days: 5 }),
    exibFim: () => faker.date.future({ days: 30 }),
    link: () => faker.internet.url(),
    organizador: () => ({
      _id: new mongoose.Types.ObjectId()
    }),
    tags: () => [faker.lorem.word(), faker.lorem.word()],
    categoria: () => faker.helpers.arrayElement([
      'empreendedorismo - Inovacao', 'artistico - Cultural', 'cientifico - Tecnologico', 'desportivos', 'palestra', 'workshops',
      'atividades - Sociais', 'gestao - Pessoas', 'outro'
    ]),
    cor: () => faker.number.int({ min: 1, max: 9 }),
    animacao: () => faker.number.int({ min: 1, max: 10 }),
    status: () => faker.helpers.arrayElement([0, 1]),
    midia: () => [
      {
        midiTipo: 'capa',
        midiLink: faker.internet.url() + "/" + uuid() + ".jpg"
      },
      {
        midiTipo: 'video',
        midiLink: faker.internet.url() + "/" + uuid() + ".mp4"
      }
    ],
    duracao: () => faker.number.int({ min: 3000, max: 5000 }), // duração em milissegundos
    loops: () => faker.number.int({ min: 3, max: 5 }), // número de loops
    permissoes: () => [
      {
        usuario: new mongoose.Types.ObjectId(),
        permissao: faker.helpers.arrayElement(['editar']),
        expiraEm: faker.date.future({ days: 30 })
      },
    ]
  }
}

/**
 * Retorna o mapping global, consolidando os mappings comuns e específicos.
 * Nesta versão automatizada, carregamos os models e combinamos o mapping comum com o mapping específico de cada model.
 */
export async function getGlobalFakeMapping() {
  const models = await loadModels();
  let globalMapping = { ...fakeMappings.common };

  models.forEach(({ name }) => {
    if (fakeMappings[name]) {
      globalMapping = {
        ...globalMapping,
        ...fakeMappings[name],
      };
    }
  });

  return globalMapping;
}

/**
 * Função auxiliar para extrair os nomes dos campos de um schema,
 * considerando apenas os níveis superiores (campos aninhados são verificados pela parte antes do ponto).
 */
function getSchemaFieldNames(schema) {
  const fieldNames = new Set();
  Object.keys(schema.paths).forEach((key) => {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(key)) return;
    const topLevel = key.split('.')[0];
    fieldNames.add(topLevel);
  });
  return Array.from(fieldNames);
}

/**
 * Valida se o mapping fornecido cobre todos os campos do model.
 * Retorna um array com os nomes dos campos que estiverem faltando.
 */
function validateModelMapping(model, modelName, mapping) {
  const fields = getSchemaFieldNames(model.schema);
  const missing = fields.filter((field) => !(field in mapping));
  if (missing.length > 0) {
    console.error(
      `Model ${modelName} está faltando mapeamento para os campos: ${missing.join(', ')}`
    );
  } else {
    console.log(`Model ${modelName} possui mapeamento para todos os campos.`);
  }
  return missing;
}

/**
 * Executa a validação para os models fornecidos, utilizando o mapping específico de cada um.
 */
async function validateAllMappings() {
  const models = await loadModels();
  let totalMissing = {};

  models.forEach(({ model, name }) => {
    // Combina os campos comuns com os específicos de cada model
    const mapping = {
      ...fakeMappings.common,
      ...(fakeMappings[name] || {}),
    };
    const missing = validateModelMapping(model, name, mapping);
    if (missing.length > 0) {
      totalMissing[name] = missing;
    }
  });

  if (Object.keys(totalMissing).length === 0) {
    console.log('globalFakeMapping cobre todos os campos de todos os models.');
    return true;
  } else {
    console.warn('Faltam mapeamentos para os seguintes models:', totalMissing);
    return false;
  }
}

// Executa a validação antes de prosseguir com o seeding ou outras operações
validateAllMappings()
  .then((valid) => {
    if (valid) {
      console.log('Podemos acessar globalFakeMapping com segurança.');
      // Prossegue com o seeding ou outras operações
    } else {
      throw new Error('globalFakeMapping não possui todos os mapeamentos necessários.');
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export default getGlobalFakeMapping;
