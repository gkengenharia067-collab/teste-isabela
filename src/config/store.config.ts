// Configuração central deste app.
// Ao clonar este projeto para um novo cliente, o objetivo é que
// SÓ ESTE ARQUIVO precise ser alterado (nome, WhatsApp, cores, prefixo de dados).

export const storeConfig = {
  // Nome exibido no dashboard, no título da aba do navegador e em outros textos.
  nome: 'Isabela Bertolli Estética',

  // Descrição usada na meta tag <description> (aparece em buscadores/links compartilhados).
  descricao: 'Agende seus serviços de estética com facilidade.',

  // Prefixo usado em todas as chaves salvas no localStorage.
  storagePrefix: '@isabela',

  // Número de WhatsApp que recebe a mensagem de confirmação de agendamento.
  // Número da Isabela (com base no site: (67) 99267-1108)
  whatsappNumero: '5567992671108',

  // Cores principais usadas nos botões, ícones e destaques.
  // Estilo neutro e elegante: preto, branco, bege e tons de cinza.
  cores: {
    primaria: 'stone',    // cor de destaque principal (títulos, botões principais)
    secundaria: 'neutral', // cor usada em botões/ícones secundários
    destaque: 'amber',     // cor usada em indicadores de sucesso/confirmação
  },

  // Senha de acesso ao painel administrativo.
  adminSenha: 'isabela2026',
}