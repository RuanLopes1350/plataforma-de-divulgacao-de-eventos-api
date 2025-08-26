import { endOfDay, startOfDay } from "date-fns";

/**
 * @func handleQuery
 * Função para tratar a query, criando os filtros, ordenação e página
 * Valor padrão da página é 1 quando não informada na query
 * @param {object} query - Query params recebidos da requisição
 * @param {object} defaultSort - Ordenação padrão caso o usuário não informe na query
 * @returns {object} A query tratada com os filtros, ordenação e página
 */
export default function (query, defaultSort) {
  const filtros = {};
  let pagina = 1;
  let limite = 10;
  let ordenar = defaultSort || { eventoCriadoEm: -1 }; // Eventos mais recentes primeiro

  const dataAtual = new Date();

  for (const [key, value] of Object.entries(query)) {
    if (key === "page") {
      pagina = parseInt(value);
      continue;
    }

    if (key === "limite") {
      limite = parseInt(value);
      if (limite > 100) limite = 100;
      continue;
    }

    // Tratamento de ordenação
    if (key === "ordenar") {
      const sort = value.split(":");
      if (sort.length === 2) {
        const ordem = sort[1] === "desc" ? -1 : 1;
        ordenar = { [sort[0]]: ordem };
      }
      continue;
    }

    if (key === "status") {
      filtros.status = value;
      continue;
    }

    // Tratamento de tipo (histórico, ativo, futuro)
    if (key === "tipo") {
      switch (value) {
        case "historico":
          filtros.dataEvento = { $lt: dataAtual };
          if (!query.status) filtros.status = "ativo"; // Por padrão, apenas eventos ativos
          break;
        case "ativo":
          filtros.dataEvento = {
            $gte: startOfDay(dataAtual),
            $lte: endOfDay(dataAtual),
          };
          if (!query.status) filtros.status = "ativo";
          break;
        case "futuro":
          filtros.dataEvento = { $gt: dataAtual };
          if (!query.status) filtros.status = "ativo";
          break;
      }
      continue;
    }

    // Tratamento de tags (array de strings separadas por vírgula)
    if (key === "tags") {
      const tags = value.split(",").map((tag) => tag.trim());
      if (tags.length > 0) {
        filtros.tags = { $in: tags };
      }
      continue;
    }

    // Tratamento de datas de início e fim
    if (key === "dataInicio") {
      if (!filtros.dataEvento) filtros.dataEvento = {};
      filtros.dataEvento.$gte = new Date(value);
      continue;
    }

    if (key === "dataFim") {
      if (!filtros.dataEvento) filtros.dataEvento = {};
      filtros.dataEvento.$lte = new Date(value);
      continue;
    }

    // Para os campos de texto (título, descrição, local, categoria)
    if (["titulo", "descricao", "local", "categoria"].includes(key) && value) {
      filtros[key] = { $regex: new RegExp(value, "i") };
    }
  }

  return { filtros, pagina, limite, ordenar };
}
