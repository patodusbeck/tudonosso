const {
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');

const TicketSchema = require('../../Schemas/Ticket');
const discord = require('discord.js');
const TicketSetup = require('../../Schemas/TicketSetup');
const config = require('../../config');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    const { guild, member, customId, channel } = interaction;
    const {
      ViewChannel,
      SendMessages,
      ManageChannels,
      ReadMessageHistory
    } = PermissionFlagsBits;

    // Gerar um número aleatório para o ticket
    const ticketId = Math.floor(Math.random() * 9000) + 10000;

    // Só processa selects (menus suspensos)
    if (!interaction.isStringSelectMenu()) return;

    const data = await TicketSetup.findOne({ GuildID: guild.id });
    if (!data) return;

    // Verifica se o select é o do ticket (igual ao button no setup)
    if (customId !== data.Button) return;

    // Verifica se o usuário já possui ticket aberto
    const alreadyticketEmbed = new EmbedBuilder()
      .setDescription(config.ticketAlreadyExist)
      .setColor(config.color);

    const findTicket = await TicketSchema.findOne({
      GuildID: guild.id,
      OwnerID: member.id
    });

    if (findTicket) {
      return interaction
        .reply({ embeds: [alreadyticketEmbed], ephemeral: true })
        .catch(() => { });
    }

    // Verifica permissão do bot
    if (!guild.members.me.permissions.has(ManageChannels)) {
      return interaction
        .reply({ content: 'Sem permissões', ephemeral: true })
        .catch(() => { });
    }

    // Mapeia a escolha da categoria para nomes e descrições específicas
    const categoryMap = {
      'compras_vip': {
        nameSuffix: 'doação-vip',
        description: 'Suporte para compras e benefícios VIP'
      },
      'suporte_geral': {
        nameSuffix: 'sup-geral',
        description: 'Suporte geral para dúvidas e ajuda'
      },
      'denuncia': {
        nameSuffix: 'denuncia',
        description: 'Canal para denúncias e reclamações'
      }
    };

    const selectedValue = interaction.values[0];
    const categoryData = categoryMap[selectedValue];

    if (!categoryData) {
      return interaction
        .reply({ content: 'Categoria inválida.', ephemeral: true })
        .catch(() => { });
    }

    try {
      // Cria o canal com nome específico baseado na categoria
      await guild.channels.create({
        name: `${config.ticketName}${categoryData.nameSuffix}-${ticketId}`,
        type: ChannelType.GuildText,
        parent: data.Category,
        permissionOverwrites: [
          {
            id: interaction.user.id,
            allow: [
              discord.PermissionFlagsBits.SendMessages,
              discord.PermissionFlagsBits.ViewChannel,
              discord.PermissionFlagsBits.ReadMessageHistory
            ],
          },
          {
            id: data.Everyone,
            deny: [discord.PermissionFlagsBits.ViewChannel],
          },
          {
            id: data.Handlers,
            allow: [
              discord.PermissionFlagsBits.ViewChannel,
              discord.PermissionFlagsBits.SendMessages,
              discord.PermissionFlagsBits.ReadMessageHistory,
              discord.PermissionFlagsBits.ManageChannels
            ],
          }
        ],
      })
      .catch(() => { })
      .then(async (channel) => {

        await TicketSchema.create({
          GuildID: guild.id,
          OwnerID: member.id,
          MemberID: member.id,
          TicketID: ticketId,
          ChannelID: channel.id,
          Locked: false,
          Claimed: false,
          Category: categoryData.nameSuffix // Pode armazenar categoria para registros, se quiser
        });

        await channel
          .setTopic(`${config.ticketDescription} ${categoryData.description} - <@${member.id}>`)
          .catch(() => { });

        const embed = new EmbedBuilder()
          .setTitle(config.title)
          .setThumbnail(config.thumbnail)
          .setColor(config.color)
          .setDescription(
            `<:users:1096647887422759024> **Usuário:** ${interaction.user}\n` +
            `<:Reply:1093347552444825620> ${interaction.user.id}\n` +
            `📜 **Por favor, aguarde. Nossa equipe irá atendê-lo neste canal em breve.**`
          );

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket-close')
            .setLabel(config.ticketClose)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(config.ticketCloseEmoji),

          /*new ButtonBuilder()
            .setCustomId('ticket-manage')
            .setLabel(config.ticketManage)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(config.ticketManageEmoji),*/

          new ButtonBuilder()
            .setCustomId('ticket-claim')
            .setLabel(config.ticketClaim)
            .setStyle(ButtonStyle.Success)
            .setEmoji(config.ticketClaimEmoji),

            new ButtonBuilder()
            .setCustomId('staff_panel')
            .setLabel('🔒 Painel Staff')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(config.ticketClaimEmoji),
        );

        await channel.send({
          embeds: [embed],
          components: [buttons]
        }).catch(() => { });

        // Marca os handlers/moderadores e apaga a menção logo após
        const handlersmention = await channel.send({ content: `<@&${data.Handlers}>` });
        handlersmention.delete().catch(() => { });

        const ticketmessage = new EmbedBuilder()
          .setColor(config.color)
          .setDescription(
            `${config.ticketCreate}\n<:Reply:1093347552444825620> <#${channel.id}>`
          );

        interaction.reply({
          embeds: [ticketmessage],
          ephemeral: true
        }).catch(() => { });
      });

    } catch (err) {
      console.log(err);
    }
  }
};
