const {
  ActionRowBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const TicketSchema = require('../../Schemas/Ticket');
const TicketSetup = require('../../Schemas/TicketSetup');
const STAFF_ROLE_ID = '1079207706050691119';
const config = require('../../config');
const { createTranscript } = require('discord-html-transcripts');

module.exports = async (interaction) => {

  const { guild, channel, member, customId } = interaction;

  // 🔒 PERMISSÃO STAFF
  if (!member.roles.cache.has(STAFF_ROLE_ID)) {
    return interaction.reply({
      content: '❌ Você não tem permissão para usar o Painel Staff.',
      ephemeral: true
    });
  }

  /* ======================================================
     🔒 PAINEL STAFF
  ====================================================== */
  if (customId === 'staff_panel') {
    const embed = new EmbedBuilder()
      .setColor('#2f3136')
      .setTitle('🔒 PAINEL ADMINISTRATIVO DO TICKET')
      .setDescription(
        `Olá ${member}, seja bem-vindo ao painel administrativo do ticket.\n` +
        `Aqui você encontrará todas as opções de gerenciamento do ticket,\n` +
        `caso haja alguma dúvida informe com os responsáveis.`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('staff_notify')
        .setLabel('🔔 Notificar Membro')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('staff_close')
        .setLabel('❌ Fechar Ticket')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('staff_rename_channel')
        .setLabel('✍️ Renomear Canal')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel('Assumir')
        .setStyle(ButtonStyle.Success)
    );

    return interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }

  /* ======================================================
     🔔 NOTIFICAR
  ====================================================== */
  if (customId === 'staff_notify') {
    const embed = new EmbedBuilder()
      .setColor('#2f3136')
      .setTitle('🔔 Notificar Solicitante')
      .setDescription('Escolha como deseja notificar o solicitante do ticket.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('staff_notify_auto')
        .setLabel('📨 Mensagem Automática')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('staff_notify_manual')
        .setLabel('✍️ Mensagem Manual')
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }

  /* ======================================================
     ✏️ RENOMEAR CANAL
  ====================================================== */
  if (customId === 'staff_rename_channel') {
    const modal = new ModalBuilder()
      .setCustomId('staff_rename_modal')
      .setTitle('Renomear Canal');

    const input = new TextInputBuilder()
      .setCustomId('new_channel_name')
      .setLabel('Novo nome do canal')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  if (customId === 'staff_rename_modal') {
    const newName = interaction.fields.getTextInputValue('new_channel_name');
    await channel.setName(newName);

    return interaction.reply({
      content: `✅ Canal renomeado para **${newName}**.`,
      ephemeral: true
    });
  }

  /* ======================================================
     🏷️ CLAIMAR TICKET (BUG CORRIGIDO)
  ====================================================== */
  if (customId === 'ticket_claim') {

    // responde SEMPRE → evita "a interação falhou"
    await interaction.deferUpdate();

    const data = await TicketSchema.findOne({
      GuildID: guild.id,
      ChannelID: channel.id
    });
    if (!data) return;

    if (data.Claimed) {
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(config.color)
            .setDescription(
              `${config.ticketAlreadyClaim} <@${data.ClaimedBy}>`
            )
        ]
      });
      return;
    }

    await TicketSchema.updateOne(
      { GuildID: guild.id, ChannelID: channel.id },
      { Claimed: true, ClaimedBy: member.id }
    );

    await channel.edit({
      name: `${config.ticketCheck}・${channel.name}`,
      topic: `${channel.topic}${config.ticketDescriptionClaim}<@${member.id}>`
    });

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(config.color)
          .setTitle('Central de Suporte')
          .setDescription(config.ticketSuccessClaim)
      ]
    });

    return;
  }

  /* ======================================================
     ❌ FINALIZAR TICKET
  ====================================================== */
  if (customId === 'staff_close') {

    await interaction.deferUpdate();

    const data = await TicketSchema.findOne({
      GuildID: guild.id,
      ChannelID: channel.id
    });
    if (!data) return;

    const docs = await TicketSetup.findOne({ GuildID: guild.id });
    if (!docs) return;

    const transcript = await createTranscript(channel, {
      limit: -1,
      returnType: 'attachment',
      saveImages: true,
      poweredBy: false,
      filename: `${config.ticketName}${data.TicketID}.html`
    });

    const claimed = data.Claimed ? '✅' : '❌';
    const claimedBy = data.ClaimedBy ? `<@${data.ClaimedBy}>` : '❌';
    const timestamp = Math.round(Date.now() / 1000);

    const transcriptEmbed = new EmbedBuilder().setDescription(
      `${config.ticketTranscriptMember} <@${data.OwnerID}>\n` +
      `${config.ticketTranscriptTicket} ${data.TicketID}\n` +
      `${config.ticketTranscriptClaimed} ${claimed}\n` +
      `${config.ticketTranscriptModerator} ${claimedBy}\n` +
      `${config.ticketTranscriptTime} <t:${timestamp}:F>`
    );

    await guild.channels.cache.get(docs.Transcripts)?.send({
      embeds: [transcriptEmbed],
      files: [transcript]
    });

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(config.ticketCloseTitle)
          .setDescription(config.ticketCloseDescription)
          .setColor(config.color)
      ]
    });

    await TicketSchema.deleteOne({
      GuildID: guild.id,
      ChannelID: channel.id
    });

    setTimeout(() => {
      channel.delete().catch(() => {});
    }, 5000);

    return;
  }
};
