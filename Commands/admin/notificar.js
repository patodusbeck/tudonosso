const {
  SlashCommandBuilder,
  ActionRowBuilder,
  UserSelectMenuBuilder,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('notificar')
    .setDescription('📩 Enviar uma mensagem privada para um usuário')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const menu = new UserSelectMenuBuilder()
      .setCustomId('notificar_user')
      .setPlaceholder('Selecione o usuário')
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: '👤 Selecione o usuário que deseja notificar:',
      components: [row],
      ephemeral: true
    });
  }
};
