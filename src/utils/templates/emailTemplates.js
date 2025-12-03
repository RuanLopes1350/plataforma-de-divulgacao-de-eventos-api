import "dotenv/config";

const FRONTEND_URL = process.env.URL_FRONTEND || "http://localhost:3000";

const LOGO_BRANCA_URL = "https://i.imgur.com/pHjP2qy.png";
const COR_PRIMARIA = "#4338CA";
const COR_SECUNDARIA = "#6B46C1";

const LINK_LUIS = "https://www.linkedin.com/in/luis-felipe-lopes-638712331/";
const LINK_RUAN = "https://www.linkedin.com/in/ruan-lopes-1350s";
const LINK_EDUARDO = "https://www.linkedin.com/in/eduardotartas/";
const FOOTER_HTML = `
  Plataforma desenvolvida pelos alunos de ADS do IFRO Campus Vilhena.
  <br>
  <a href="${LINK_LUIS}" style="color: #4338CA; text-decoration: none;">Luis Felipe Lopes</a> - 
  <a href="${LINK_RUAN}" style="color: #4338CA; text-decoration: none;">Ruan de Oliveira Lopes</a> - 
  <a href="${LINK_EDUARDO}" style="color: #4338CA; text-decoration: none;">Eduardo Tartas</a>
`;

let linkSite=process.env.URL_FRONTEND || "http://localhost:3000";

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
    mostrarDivisor: true,

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
    mostrarBotaoSecundario: true,
    textoBotaoSecundario: "Ir para o IFRO Events",
    urlBotaoSecundario: FRONTEND_URL,
    corBotaoSecundario: COR_SECUNDARIA,

    // --- Footer ---
    textoFooter: FOOTER_HTML
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
    mostrarBotaoSecundario: true,
    textoBotaoSecundario: "Ir para o IFRO Events",
    urlBotaoSecundario: FRONTEND_URL,
    corBotaoSecundario: COR_SECUNDARIA,

    // --- Footer ---
    textoFooter: FOOTER_HTML
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
    mostrarBotaoSecundario: true,
    textoBotaoSecundario: "Ir para o IFRO Events",
    urlBotaoSecundario: FRONTEND_URL,
    corBotaoSecundario: COR_SECUNDARIA,

    // --- Footer ---
    textoFooter: FOOTER_HTML
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
    mostrarBotaoSecundario: true,
    textoBotaoSecundario: "Ir para o IFRO Events",
    urlBotaoSecundario: FRONTEND_URL,
    corBotaoSecundario: COR_SECUNDARIA,

    // --- Footer ---
    textoFooter: FOOTER_HTML
  },
});
