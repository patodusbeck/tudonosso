require('dotenv').config();

module.exports = {

    /* ============================================================
       CONFIGURAÇÃO BÁSICA
    ============================================================ */

    token: process.env.DISCORD_TOKEN,
    developerGuildID: process.env.DEVELOPER_GUILD_ID,
    errorChannel: process.env.ERROR_CHANNEL_ID,
    database: process.env.MONGODB_URI,


    /* ============================================================
       ATIVIDADES / STATUS DO BOT
    ============================================================ */

    oneac: 'suas dúvidas...',
    twoac: 'felicidades ✦',
    threeac: 'Vem pro Bcc! ✦',


    /* ============================================================
       CONFIGURAÇÃO DO SISTEMA DE TICKETS
    ============================================================ */

    /* --------------------
       EMBED PRINCIPAL
    -------------------- */

    title: 'Canal de Atendimento',
    thumbnail: 'https://cdn.discordapp.com/attachments/1031035894548942931/1333425160178372618/layer.png?',
    image: 'https://media.discordapp.net/attachments/1329623276703453224/1329651166170185738/backgroundgtaequipoudesigner70.jpg?',
    color: '#9c89ad',
    kaxcav: 'https://i.imgur.com/ZHerPyt.jpeg',
    footer: 'Bcc Roleplay © 2026 ',


    /* --------------------
       NÃO MEXER AQUI
       (A NÃO SER QUE SAIBA O QUE ESTÁ FAZENDO)
    -------------------- */

    /*ticketName: ':support:-',*/
    VerifiedRole: '1079207706050691116',
    roleIdModerador: '1079207706050691119',
    ticketName: '',
    ticketDescription: '✦ Suporte solicitado por',
    ticketCreate: '<:users:1096647887422759024> Suporte em andamento! Prossiga para este canal.',
    ticketAlreadyExist: 'Você já está em uma sala de atendimento!',
    ticketNoPermissions: 'Você não tem a devida autorização para executar essa ação.',
    ticketError: 'Não foi possível fazer isso agora... Tente mais tarde!',

    ticketMessageTitle: 'Bem vindo! Como podemos ajudá-lo?.',
    ticketMessageDescription: 'Em breve, nosso time de suporte o atenderá.\nObrigado por aguardar com calma e bom humor.',

    ticketClose: 'Cancelar Contato',
    ticketCloseEmoji: '<:crosscircle:1122372730596110466>',

    ticketClaim: 'Assumir Suporte',
    ticketCheck: '✅',
    ticketClaimEmoji: '<:passaport:1097934201841516596>',

    ticketManage: 'Adicionar Membro',
    ticketManageEmoji: '<:users:1121581548777517056>',
    ticketManageMenuTitle: 'Selecione quem deseja adicionar ao atendimento.',
    ticketManageMenuEmoji: '❔ ',

    ticketCloseTitle: 'Atendimento Encerrado',
    ticketCloseDescription: 'Agradecemos pelo contato.',

    ticketSuccessClaim: '<:comments:1122367907800821840>  Seja bem-vindo à equipe de suporte do Bcc Roleplay! Em que podemos ajudar você hoje?',
    ticketAlreadyClaim: 'Atendimento em andamento por',
    ticketDescriptionClaim: ', atendido por ',

    ticketTranscriptMember: 'Membro:',
    ticketTranscriptTicket: 'Ticket:',
    ticketTranscriptClaimed: 'Assumido:',
    ticketTranscriptModerator: 'Administrador que assumiu:',
    ticketTranscriptTime: 'Quando:',

    ticketMemberAdd: 'foi adicionado ao suporte.',
    ticketMemberRemove: 'foi removido ao suporte.',
};
