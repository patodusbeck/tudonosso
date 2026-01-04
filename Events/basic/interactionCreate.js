const {
  Events,
  InteractionType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const { PIX } = require('gpix/dist');
const Canvas = require('canvas');
const config = require('../../config');
module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction, client) {
console.log('[Interaction]', interaction.customId);
    try {

      // 🔒 PAINEL STAFF (isolado, não interfere em outros sistemas)
if (
  interaction.isButton() ||
  interaction.isStringSelectMenu() ||
  interaction.isModalSubmit()
) {
  if (
    interaction.customId === 'staff_panel' ||
    interaction.customId.startsWith('staff_') ||
    interaction.customId === 'ticket_claim'
  ) {
    const staffPanel = require('../ticketSystem/staffPanel');
    return staffPanel(interaction);
  }
}

      /* ============================================================
         SLASH COMMANDS
      ============================================================ */
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
          return await command.execute(interaction, client);
        } catch (err) {
          console.error(err);
          if (!interaction.replied && !interaction.deferred) {
            return interaction.reply({
              content: '❌ Erro ao executar o comando.',
              ephemeral: true
            });
          }
          return;
        }
      }

      /* ============================================================
         BOTÕES
      ============================================================ */
      if (interaction.isButton()) {

        /* ----------------- BOTÃO PIX ----------------- */
        if (interaction.customId === 'pix_configurar') {

          if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });
          }

          const modal = new ModalBuilder()
            .setCustomId('pix_modal')
            .setTitle('Configurar Pagamento PIX');

          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('pix_valor')
                .setLabel('Valor (somente números)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('pix_produto')
                .setLabel('Produto')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('pix_chave')
                .setLabel('Chave PIX')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            )
          );

          return interaction.showModal(modal);
        }

        /* ----------------- BOTÃO VOLTAR - REGRAS ----------------- */
        if (interaction.customId === 'regras_voltar') {

          const embedPrincipal = new EmbedBuilder()
            .setTitle('📜 Central de Regras')
            .setDescription(
              'Selecione no menu abaixo qual conjunto de regras deseja visualizar.\n\n' +
              '⚠️ A leitura é registrada automaticamente.'
            )
            .setColor(config.color);

          return interaction.update({
            embeds: [embedPrincipal],
            components: [client.selectMenus.get('menu_regras')]
          });
        }

        return;
      }

      /* ============================================================
         STRING SELECT MENU (REGRAS)
      ============================================================ */
      if (interaction.isStringSelectMenu()) {

        if (interaction.customId !== 'menu_regras') return;

        const regras = {
          cidade: '🏙️ **Regras da Cidade**\n• Respeite as leis\n• Proibido abuso de bugs',
          convivencia: '🤝 **Regras de Convivência**\n• Respeito obrigatório\n• Sem ofensas',
          gerais: '📌 **Regras Gerais**\n• Bom senso\n• Punições aplicáveis',
          discord: '💬 **Regras do Discord**\n• Sem spam\n• Respeite a staff'
        };

        const texto = regras[interaction.values[0]];
        if (!texto) return;

        const embed = new EmbedBuilder()
          .setDescription(texto)
          .setColor(config.color)
          .setFooter({ text: 'Leitura registrada automaticamente.' });

        const voltar = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('regras_voltar')
            .setLabel('Voltar')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️')
        );

        return interaction.update({
          embeds: [embed],
          components: [voltar]
        });
      }

      /* ============================================================
         MODALS
      ============================================================ */
      if (interaction.type === InteractionType.ModalSubmit) {

        if (interaction.customId === 'pix_modal') {

          if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });
          }

          const valor = Number(interaction.fields.getTextInputValue('pix_valor'));
          const produto = interaction.fields.getTextInputValue('pix_produto');
          const chave = interaction.fields.getTextInputValue('pix_chave');

          const pix = PIX.static()
            .setReceiverName(interaction.client.user.username.slice(0, 25))
            .setReceiverCity('Brasil')
            .setKey(chave)
            .setDescription(produto)
            .setAmount(valor);

          const canvas = Canvas.createCanvas(1200, 1200);
          const ctx = canvas.getContext('2d');

          const qr = await Canvas.loadImage(await pix.getQRCode());
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(qr, 0, 0, canvas.width, canvas.height);

          const embed = new EmbedBuilder()
            .setTitle('Benefícios Premium')
            .setImage('attachment://qrcode.png')
            .addFields(
              { name: '🛒 Produto', value: produto },
              { name: '💰 Valor', value: `R$ ${valor.toFixed(2)}` }
            )
            .setColor(config.color);

          return interaction.reply({
            embeds: [embed],
            files: [{ name: 'qrcode.png', attachment: canvas.toBuffer() }]
          });
        }
      }

    } catch (error) {
      console.error('InteractionCreate CRASH:', error);
    }
  }
};

