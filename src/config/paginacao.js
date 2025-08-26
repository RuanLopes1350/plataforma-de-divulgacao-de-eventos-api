import paginate from "mongoose-paginate-v2";

paginate.paginate.options = {
  leanWithId: false
};

const myCustomLabels = {
    totalDocs: "resultados",
    docs: "data",
    limit: "limite",
    page: "pagina",
    totalPages: "totalPaginas",
    pagingCounter: false,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: false,
    nextPage: false
};

export const paginateOptions = {
    page: 1,
    limit: 50,
    customLabels: myCustomLabels
};