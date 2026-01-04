const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'menu_regras') return;

    const escolha = interaction.values[0];

    let embed;

    switch (escolha) {
      case 'cidade':
        embed = new EmbedBuilder()
          .setTitle('🏙️ Regras da Cidade')
          .setDescription(
            '• Power Gaming é proibido\n' +
            '• Meta Gaming é proibido\n' +
            '• RDM e VDM são puníveis\n' +
            '• Valorize sua vida'
          )
          .setColor('#9c89ad');
        break;

      case 'convivencia':
        embed = new EmbedBuilder()
          .setTitle('🤝 Regras de Convivência')
          .setDescription(
            '• Respeito acima de tudo\n' +
            '• Ofensas não serão toleradas\n' +
            '• Preconceito gera punição severa'
          )
          .setColor('#9c89ad');
        break;

      case 'gerais':
        embed = new EmbedBuilder()
          .setTitle('📌 Regras Gerais')
          .setDescription(
            '• Uso de bugs resulta em punição\n' +
            '• Exploits são proibidos\n' +
            '• Decisões da staff são finais'
          )
          .setColor('#9c89ad');
        break;

      case 'discord':
        embed = new EmbedBuilder()
          .setTitle('💬 Regras do Discord')
          .setDescription(
            '• Proibido spam\n' +
            '• Proibido flood\n' +
            '• Proibido conteúdo NSFW'
          )
          .setColor('#9c89ad');
        break;
    }

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
