import "dotenv/config";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const emailDeBoasVindas = (data) => ({
  to: data.email,
  subject: "Bem-vindo ao IFRO Events!",
  template: "bemvindo",
  data: {
    nome: data.nome,
    logoUrl: "https://i.imgur.com/pHjP2qy.png",
    mensagem: "Bem-vindo ao IFRO Events! Estamos felizes em tê-lo conosco.",
    mostrarBotao: true,
    textoBotao: "Começar",
    urlBotao: `${FRONTEND_URL}/login`
  }
});

// -----------

export const emailRecover = (data) => ({
  to: data.email,
  subject: "Recuperação de Senha - IFRO Events",
  template: "generico",
  data: {
    logoUrl: "https://i.imgur.com/pHjP2qy.png",
    mostrarHeader: true,
    corPrimaria: "#4338CA",
    nome: data.nome,
    titulo: "Recuperação de Senha",
    mensagem:
      "Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para prosseguir com a recuperação de sua conta.",
    textoDestaque: "Este link expira em 1 hora.",
    mostrarBotao: true,
    textoBotao: "Alterar Senha",
    urlBotao: `${FRONTEND_URL}/recuperar_senha/${data.token}`,
    corBotao: "#4338CA",
  },
});

// -----------

export const emailCompartilhamentoDono = (data) => ({
  to: data.email,
  subject: "Compartilhamento de permissão - IFRO Events",
  template: "generico",
  data: {
    logoUrl: "https://i.imgur.com/pHjP2qy.png",
    mostrarHeader: true,
    corPrimaria: "#4338CA",
    nome: data.nomeDono,
    titulo: "Compartilhamento de permissão",
    mensagem:
      `Você concedeu permissões de acesso ao evento "${data.evento}" para ${data.nome}. Caso não tenha realizado essa ação, entre em contato com o suporte.`,
  },
});

export const emailCompartilhamento = (data) => ({
  to: data.email,
  subject: "Compartilhamento de permissão - IFRO Events",
  template: "generico",
  data: {
    logoUrl: "https://i.imgur.com/pHjP2qy.png",
    mostrarHeader: true,
    corPrimaria: "#4338CA",
    nome: data.nome,
    titulo: "Compartilhamento de permissão",
    mensagem:
      `Você recebeu permissões de acesso ao evento "${data.evento}" concedidas por ${data.nomeDono}. Caso não reconheça essa ação, entre em contato com o suporte.`,
  },
});
