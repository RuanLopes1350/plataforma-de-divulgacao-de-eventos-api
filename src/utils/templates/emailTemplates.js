import "dotenv/config";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const LOGO_BRANCA_URL = "https://i.imgur.com/pHjP2qy.png";
const COR_PRIMARIA = "#4338CA";

export const emailDeBoasVindas = (data) => ({
  to: data.email,
  subject: "Bem-vindo(a) ao IFRO Events!",
  template: "generico",
  data: {
    // --- Header ---
    mostrarHeader: true,
    logoUrl: LOGO_BRANCA_URL,
    corPrimaria: COR_PRIMARIA,
    nomeSistema: "IFRO Events",

    // --- Conteúdo ---
    titulo: "Bem-vindo(a) ao IFRO Events!",
    nome: data.nome,
    mensagem:
      "Sua conta foi criada com sucesso e estamos felizes em ter você conosco.<br><br>Para seu primeiro acesso, só falta um passo: <strong>definir sua senha para poder acessar a plataforma!</strong>. Clique no botão abaixo para começar.",

    // --- Ação ---
    mostrarBotao: true,
    textoBotao: "Definir minha senha",
    urlBotao: `${FRONTEND_URL}/nova_senha/${data.token}`,
    corBotao: COR_PRIMARIA,

    // --- Footer ---
    ano: new Date().getFullYear(),
  }
});

// -----------

export const emailRecover = (data) => ({
  to: data.email,
  subject: "Redefinição de Senha - IFRO Events",
  template: "generico",
  data: {
    // --- Header ---
    mostrarHeader: true,
    logoUrl: LOGO_BRANCA_URL,
    corPrimaria: COR_PRIMARIA,
    nomeSistema: "IFRO Events",

    // --- Conteúdo ---
    nome: data.nome,
    titulo: "Redefina sua senha",
    mensagem:
      "Recebemos uma solicitação para redefinir a senha da sua conta.<br><br>Se foi você, clique no botão abaixo para criar uma nova senha. Se você não fez essa solicitação, pode ignorar este e-mail com segurança.",
    textoDestaque: "Por segurança, este link expira em <strong>1 hora</strong>.",

    // --- Ação ---
    mostrarBotao: true,
    textoBotao: "Criar nova senha",
    urlBotao: `${FRONTEND_URL}/nova_senha/${data.token}`,
    corBotao: COR_PRIMARIA,

    // --- Footer ---
    ano: new Date().getFullYear(),
  },
});

// -----------

export const emailCompartilhamentoDono = (data) => ({
  to: data.email,
  subject: "Confirmação de compartilhamento - IFRO Events",
  template: "generico",
  data: {
    // --- Header ---
    mostrarHeader: true,
    logoUrl: LOGO_BRANCA_URL,
    corPrimaria: COR_PRIMARIA,
    nomeSistema: "IFRO Events",

    // --- Conteúdo ---
    nome: data.nomeDono,
    titulo: "Compartilhamento realizado",
    // NOVO: Usando <strong> para destacar nomes e eventos
    mensagem:
      `Olá! Você concedeu permissões de acesso ao evento <strong>"${data.evento}"</strong> para o usuário <strong>${data.nome}</strong>.<br><br>Caso não reconheça esta ação, recomendamos que altere sua senha e entre em contato com o suporte.`,

    // --- Ação ---
    mostrarBotao: true,
    textoBotao: "Ver evento",
    urlBotao: `${FRONTEND_URL}/meus-eventos/${data.eventoId}`, // Você precisará passar o 'eventoId'
    corBotao: COR_PRIMARIA,

    // --- Footer ---
    ano: new Date().getFullYear(),
  },
});

export const emailCompartilhamento = (data) => ({
  to: data.email,
  subject: "Você recebeu acesso a um evento no IFRO Events",
  template: "generico",
  data: {
    // --- Header ---
    mostrarHeader: true,
    logoUrl: LOGO_BRANCA_URL,
    corPrimaria: COR_PRIMARIA,
    nomeSistema: "IFRO Events",

    // --- Conteúdo ---
    nome: data.nome,
    titulo: "Você foi convidado!",
    mensagem:
      `Boas notícias! <strong>${data.nomeDono}</strong> compartilhou o evento <strong>"${data.evento}"</strong> com você.<br><br>Agora você pode acessar os detalhes e gerenciar o evento diretamente na plataforma clicando no botão abaixo.`,

    // --- Ação ---
    mostrarBotao: true,
    textoBotao: "Acessar o evento",
    urlBotao: `${FRONTEND_URL}/eventos/${data.eventoId}`, // Você precisará passar o 'eventoId'
    corBotao: COR_PRIMARIA,

    // --- Footer ---
    ano: new Date().getFullYear(),
  },
});
