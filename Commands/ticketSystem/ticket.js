const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');

const TicketSetup = require('../../Schemas/TicketSetup');
const config = require('../../config');
const Discord = require('discord.js');

module.exports = {
  data: new Discord.SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Setup da Central')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Canal designado ao Setup')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )

    .addChannelOption((option) =>
      option
        .setName('category')
        .setDescription("Categoria do Atendimento's")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildCategory)
    )

    .addChannelOption((option) =>
      option
        .setName('transcripts')
        .setDescription('Canal dos registros de Log.')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )

    .addRoleOption((option) =>
      option
        .setName('handlers')
        .setDescription('Cargo Moderador.')
        .setRequired(true)
    )

    .addRoleOption((option) =>
      option
        .setName('everyone')
        .setDescription('Cargo Everyone.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const { guild, options } = interaction;

    /* 🔐 CÓDIGO ÚNICO */
    const button = `SUP-${Date.now().toString(36).toUpperCase()}`;

    try {
      const channel = options.getChannel('channel');
      const category = options.getChannel('category');
      const transcripts = options.getChannel('transcripts');
      const handlers = options.getRole('handlers');
      const everyone = options.getRole('everyone');
      /*const button = options.getString('button');*/

      await TicketSetup.findOneAndUpdate(
        { GuildID: guild.id },
        {
          Channel: channel.id,
          Category: category.id,
          Transcripts: transcripts.id,
          Handlers: handlers.id,
          Everyone: everyone.id,
          Button: button,
        },
        {
          new: true,
          upsert: true,
        }
      );

      const embed = new Discord.EmbedBuilder()
        .setTitle('Central de Suporte')
        .setThumbnail(config.thumbnail)
        .setColor(config.color)
        .setFooter({
          text: 'Bcc Roleplay © 2026 ',
          iconURL: config.thumbnail
        })
        .setDescription(
          '<:Foguete:1081423107488751626> Entre em contato diretamente com nossa equipe seja para esclarecer dúvidas, adquirir beneficios VIP ou reportar bugs!'
        )
        .setFields(
          {
            name: '`💭` Suporte Geral',
            value: 'Dúvidas ou denuncias? Entre em contato.'
          },
          {
            name: '<:users:1096647887422759024> Horário de Atendimento',
            value: `**Segunda a Domingo das 09:00 às 23:00**
Podemos realizar atendimentos fora do horário informado, porém não garantimos disponibilidade.`
          }
        )
        .setImage(config.image);

        const staffButton = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId('staff_panel')
    .setLabel('🔒 Painel Staff')
    .setStyle(ButtonStyle.Secondary)
);


      /* --------------------------- MENU DE SELEÇÃO ---------------------------------------------- */
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(button)
        .setPlaceholder('Selecione uma categoria')
        .addOptions([
          {
            label: '🛒 Compras / VIP',
            description: 'Dúvidas ou pedidos relacionados a compras e VIP',
            value: 'compras_vip',
            emoji: '🛒'
          },
          {
            label: '🧾 Suporte Geral',
            description: 'Dúvidas gerais e suporte',
            value: 'suporte_geral',
            emoji: '🧾'
          },
          {
            label: '🚨 Denúncia',
            description: 'Fazer uma denúncia',
            value: 'denuncia',
            emoji: '🚨'
          }
        ]);

      await guild.channels.cache
        .get(channel.id)
        .send({
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(selectMenu)],
        })
        .catch(() => { });

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription('Setup ticket criado com sucesso.')
            .setColor(config.color)
        ],
        ephemeral: true
      });

    } catch (err) {
      console.log(err);

      const errEmbed = new EmbedBuilder()
        .setColor(config.color)
        .setDescription(config.ticketError);

      return interaction
        .reply({ embeds: [errEmbed], ephemeral: true })
        .catch(() => { });
    }
  },
};
