const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regras')
    .setDescription('Enviar o menu de regras em um canal específico')
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal onde o menu de regras será enviado')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const canal = interaction.options.getChannel('canal');

    const embed = new EmbedBuilder()
      .setTitle('📜 Central de Regras')
      .setDescription(
        'Selecione no menu abaixo qual conjunto de regras deseja visualizar.\n\n' +
        '<:aleert:1095202514216943636> O desconhecimento das regras não isenta punições.'
      )
      .setColor('#9c89ad');

    const menu = new StringSelectMenuBuilder()
      .setCustomId('menu_regras')
      .setPlaceholder('📂 Escolha um tipo de regra')
      .addOptions([
        {
          label: 'Considerações Gerais',
          value: 'geral',
          emoji: '🏙️'
        },
        {
          label: 'Diretrizes da Cidade',
          value: 'cidade',
          emoji: '🏙️'
        },
        {
          label: 'Diretrizes Discord',
          value: 'geral',
          emoji: '🏙️'
        },
        {
          label: 'Diretrizes Ticket',
          value: 'geral',
          emoji: '🏙️'
        },
        {
          label: 'Diretrizes Personagem',
          value: 'geral',
          emoji: '🏙️'
        },
        {
          label: 'Safezones',
          value: 'geral',
          emoji: '🏙️'
        },
        {
          label: 'Diretrizes Personagem',
          value: 'geral',
          emoji: '🏙️'
        },
        {
          label: 'Diretrizes de Convivência',
          value: 'convivencia',
          emoji: '🤝'
        },
        {
          label: 'Regras Gerais',
          value: 'gerais',
          emoji: '📌'
        },
        {
          label: 'Regras do Discord',
          value: 'discord',
          emoji: '💬'
        }
      ]);

    await canal.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu)]
    });

    await interaction.reply({
      content: `✅ Menu de regras enviado com sucesso em ${canal}.`,
      ephemeral: true
    });
  }
};
