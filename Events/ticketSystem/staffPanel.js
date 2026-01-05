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
const { UserSelectMenuBuilder } = require('discord.js');


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
   🔒 PAINEL STAFF (VISUAL ORGANIZADO)
====================================================== */
if (customId === 'staff_panel') {

  const embed = new EmbedBuilder()
    .setColor('#2f3136')
    .setThumbnail(config.thumbnail)
    .setTitle('<:comments:1122367907800821840> PAINEL STAFF')
    .setDescription(
      `<:bcc:1100528023415046257> Olá ${member}, seja bem-vindo ao painel administrativo do ticket.\n` +
      `Aqui você encontrará todas as opções de gerenciamento do ticket.\n` +
      `Caso haja alguma dúvida, informe com os responsáveis.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━`
    )
    .addFields(
      {
        name: '<:users:1121581548777517056> Adicionar Membro',
        value: '> Adicione um membro ao ticket.',
        inline: false
      },
      {
        name: '<:users:1121581548777517056> Remover Membro',
        value: '> Remove um membro do ticket.',
        inline: false
      },
      {
        name: '<:refresh:1121581824930500698> Renomear Canal',
        value: '> Renomeia o nome do ticket.',
        inline: false
      },
      {
        name: '<:bellring:1122368889184059482> Notificar Membro',
        value: '> Notifica o autor do ticket no privado.',
        inline: false
      },
      {
        name: '<:badgecheck:1122372710085963786> Finalizar Atendimento',
        value: '> Inicia o processo de fechamento do ticket.',
        inline: false
      }
    )
        .setFooter({
          text: config.footer,
          iconURL: config.thumbnail
        })

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket-manage')
      .setLabel('Gerenciar Membros')
      .setEmoji('<:users:1121581548777517056>')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('staff_notify')
      .setLabel('Notificar Membro')
      .setEmoji('<:bellring:1122368889184059482>')
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('staff_rename_channel')
      .setLabel('Renomear Canal')
      .setEmoji('<:refresh:1121581824930500698>')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('staff_close')
      .setLabel('Finalizar Ticket')
      .setEmoji('<:badgecheck:1122372710085963786>')
      .setStyle(ButtonStyle.Danger)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_claim')
      .setLabel('Assumir Ticket')
      .setEmoji('<:rocketlunch:1122367562051752008>')
      .setStyle(ButtonStyle.Success)
  );

  return interaction.reply({
    embeds: [embed],
    components: [row1, row2, row3],
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
   👤 GERENCIAR / ADICIONAR MEMBRO AO TICKET
====================================================== */
if (customId === 'ticket-manage') {

  const { ManageChannels } = PermissionFlagsBits;

  // buscar setup do ticket
  const docs = await TicketSetup.findOne({ GuildID: guild.id });
  if (!docs) {
    return interaction.reply({
      content: 'Configuração de ticket não encontrada.',
      ephemeral: true
    });
  }

  // verificar permissão
  if (
    !member.permissions.has(ManageChannels) &&
    !member.roles.cache.has(docs.Handlers)
  ) {
    const noPermissionsEmbed = new EmbedBuilder()
      .setColor(config.color)
      .setDescription('❌ Você não tem permissão para gerenciar membros deste ticket.');

    return interaction.reply({
      embeds: [noPermissionsEmbed],
      ephemeral: true
    });
  }

  // menu de seleção de usuário
  const menu = new UserSelectMenuBuilder()
    .setCustomId('ticket-manage-menu')
    .setPlaceholder(
      config.ticketManageMenuEmoji + config.ticketManageMenuTitle
    )
    .setMinValues(1)
    .setMaxValues(1);

  return interaction.reply({
    components: [
      new ActionRowBuilder().addComponents(menu)
    ],
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
    // 📨 NOTIFICAÇÃO AUTOMÁTICA
  if (interaction.customId === 'staff_notify_auto') {
    const ticket = await TicketSchema.findOne({
      GuildID: interaction.guild.id,
      ChannelID: interaction.channel.id
    });
    if (!ticket) return;

    const user = await interaction.client.users.fetch(ticket.OwnerID);

    await user.send(
      `🔔 **Atualização no seu ticket**\n\n` +
      `Nossa equipe respondeu e aguarda seu retorno no ticket:\n` +
      `${interaction.channel}`
    );

    return interaction.reply({
      content: '✅ Mensagem automática enviada ao solicitante.',
      ephemeral: true
    });
  }

  // ✍️ MODAL DE MENSAGEM MANUAL
  if (interaction.customId === 'staff_notify_manual') {
    const modal = new ModalBuilder()
      .setCustomId('staff_notify_modal')
      .setTitle('Mensagem Manual');

    const input = new TextInputBuilder()
      .setCustomId('notify_message')
      .setLabel('Mensagem que será enviada ao solicitante')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );

    return interaction.showModal(modal);
  }

  // 📩 ENVIAR MENSAGEM MANUAL
  if (interaction.customId === 'staff_notify_modal') {
    const message = interaction.fields.getTextInputValue('notify_message');

    const ticket = await TicketSchema.findOne({
      GuildID: interaction.guild.id,
      ChannelID: interaction.channel.id
    });
    if (!ticket) return;

    const user = await interaction.client.users.fetch(ticket.OwnerID);

    await user.send(
      `🔔 **Mensagem da equipe de suporte**\n\n${message}`
    );

    return interaction.reply({
      content: '✅ Mensagem manual enviada com sucesso.',
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
