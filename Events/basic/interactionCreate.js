const {
  Events,
  InteractionType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require('discord.js');

const { PIX } = require('gpix/dist');
const Canvas = require('canvas');
const config = require('../../config');

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction, client) {

    /* ================= SLASH COMMANDS ================= */
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        if (!interaction.replied) {
          await interaction.reply({
            content: '❌ Erro ao executar o comando.',
            ephemeral: true
          });
        }
      }
      return;
    }

    /* ================= BOTÕES ================= */
    if (interaction.isButton()) {

      /* BOTÃO PIX */
      if (interaction.customId === 'pix_configurar') {

        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({ content: '❌ Sem permissão.', ephemeral: true });
        }

        const modal = new ModalBuilder()
          .setCustomId('pix_modal')
          .setTitle('Configurar Pagamento PIX');

        const valor = new TextInputBuilder()
          .setCustomId('pix_valor')
          .setLabel('Valor (somente números)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const produto = new TextInputBuilder()
          .setCustomId('pix_produto')
          .setLabel('Produto')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const chave = new TextInputBuilder()
          .setCustomId('pix_chave')
          .setLabel('Chave PIX')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(valor),
          new ActionRowBuilder().addComponents(produto),
          new ActionRowBuilder().addComponents(chave)
        );

        return interaction.showModal(modal);
      }

      return;
    }

    /* ================= USER SELECT MENU (NOTIFICAR) ================= */
    if (interaction.isUserSelectMenu()) {

      if (interaction.customId === 'notificar_user') {

        const userId = interaction.values[0];

        const modal = new ModalBuilder()
          .setCustomId(`notificar_modal_${userId}`)
          .setTitle('Enviar Notificação');

        const mensagem = new TextInputBuilder()
          .setCustomId('mensagem')
          .setLabel('Mensagem')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(mensagem)
        );

        return interaction.showModal(modal);
      }

      return;
    }

    /* ================= MODALS ================= */
    if (interaction.type === InteractionType.ModalSubmit) {

      /* MODAL PIX */
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
          .setThumbnail(config.thumbnail)
          .setImage('attachment://qrcode.png')
          .addFields(
            { name: '🛒 Produto', value: produto },
            { name: '💰 Valor', value: `R$ ${valor.toFixed(2)}` }
          )
          .setFooter({
            text: 'Após realizar a doação, envie o comprovante.',
            iconURL: config.thumbnail
          })
          .setColor(config.color);

        return interaction.reply({
          embeds: [embed],
          files: [{
            name: 'qrcode.png',
            attachment: canvas.toBuffer()
          }]
        });
      }

      /* MODAL NOTIFICAR */
      if (interaction.customId.startsWith('notificar_modal_')) {

        const userId = interaction.customId.replace('notificar_modal_', '');
        const mensagem = interaction.fields.getTextInputValue('mensagem');

        try {
          const user = await client.users.fetch(userId);

          await user.send({
            embeds: [
              new EmbedBuilder()
                .setTitle('📩 Nova Notificação')
                .setDescription(mensagem)
                .setColor(config.color)
                .setFooter({ text: 'Mensagem enviada pela administração.' })
            ]
          });

          return interaction.reply({
            content: '✅ Mensagem enviada com sucesso!',
            ephemeral: true
          });

        } catch (err) {
          console.error(err);
          return interaction.reply({
            content: '❌ Não foi possível enviar a mensagem (DM fechada?).',
            ephemeral: true
          });
        }
      }
    }
  }
};
