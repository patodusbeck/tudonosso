const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');

const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pix')
    .setDescription('🛒 Gerar QrCode Pix')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pix_configurar')
        .setLabel('⚙️ Configurar PIX')
        .setStyle(ButtonStyle.Primary)
    );

    const embed = new EmbedBuilder()
      .setTitle('QrCode Pix')
      .setThumbnail(config.thumbnail)
      .setDescription('Clique no botão abaixo para configurar **valor**, **produto** e **chave PIX**.')
      .setColor(config.color)
      .setFooter({
        text: 'Bcc Roleplay © 2026',
        iconURL: config.thumbnail
      });

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }
};
