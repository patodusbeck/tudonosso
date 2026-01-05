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
    const { guild, member, customId } = interaction;

    const {
      ViewChannel,
      SendMessages,
      ManageChannels,
      ReadMessageHistory
    } = PermissionFlagsBits;

    const ticketId = Math.floor(Math.random() * 9000) + 10000;

    if (!interaction.isStringSelectMenu()) return;

    const data = await TicketSetup.findOne({ GuildID: guild.id });
    if (!data) return;

    if (customId !== data.Button) return;

    const alreadyticketEmbed = new EmbedBuilder()
      .setDescription(config.ticketAlreadyExist)
      .setColor(config.color);

    const findTicket = await TicketSchema.findOne({
      GuildID: guild.id,
      OwnerID: member.id
    });

    if (findTicket) {
      return interaction.reply({
        embeds: [alreadyticketEmbed],
        ephemeral: true
      }).catch(() => {});
    }

    if (!guild.members.me.permissions.has(ManageChannels)) {
      return interaction.reply({
        content: 'Sem permissões',
        ephemeral: true
      }).catch(() => {});
    }

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
      return interaction.reply({
        content: 'Categoria inválida.',
        ephemeral: true
      }).catch(() => {});
    }

    try {
      await guild.channels.create({
        name: `${config.ticketName}${categoryData.nameSuffix}-${ticketId}`,
        type: ChannelType.GuildText,
        parent: data.Category,

        // 🔒 PERMISSÕES CORRIGIDAS (CANAL NASCE PRIVADO)
        permissionOverwrites: [
          {
            id: guild.id, // @everyone REAL
            deny: [ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [ViewChannel, SendMessages, ReadMessageHistory]
          },
          {
            id: data.Handlers, // cargo HANDLER
            allow: [
              ViewChannel,
              SendMessages,
              ReadMessageHistory,
              ManageChannels
            ]
          }
        ]
      })
      .then(async (channel) => {

        await TicketSchema.create({
          GuildID: guild.id,
          OwnerID: member.id,
          MemberID: member.id,
          TicketID: ticketId,
          ChannelID: channel.id,
          Locked: false,
          Claimed: false,
          Category: categoryData.nameSuffix
        });

        await channel.setTopic(
          `${config.ticketDescription} ${categoryData.description} - <@${member.id}>`
        ).catch(() => {});

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

          new ButtonBuilder()
            .setCustomId('staff_panel')
            .setLabel('🔒 Painel Staff')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(config.ticketClaimEmoji)
        );

        await channel.send({
          embeds: [embed],
          components: [buttons]
        }).catch(() => {});

        const handlersmention = await channel.send({
          content: `<@&${data.Handlers}>`
        });
        handlersmention.delete().catch(() => {});

        const ticketmessage = new EmbedBuilder()
          .setColor(config.color)
          .setDescription(
            `${config.ticketCreate}\n<:Reply:1093347552444825620> <#${channel.id}>`
          );

        interaction.reply({
          embeds: [ticketmessage],
          ephemeral: true
        }).catch(() => {});
      });

    } catch (err) {
      console.log(err);
    }
  }
};
