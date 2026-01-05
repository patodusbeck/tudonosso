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
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

const { PIX } = require('gpix/dist');
const Canvas = require('canvas');
const mongoose = require('mongoose');
const config = require('../../config');

/* ================= PIX MODEL (COMPATÍVEL) ================= */
const PixModel =
  mongoose.models.Pix ||
  mongoose.model(
    'Pix',
    new mongoose.Schema({
      userId: String,
      produto: String,
      valor: Number,
      chave: String,
      codigo: String,
      codigoPix: String,
      status: { type: String, default: 'PENDENTE' },
      criadoEm: { type: Date, default: Date.now },
      expiraEm: Date
    })
  );

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction, client) {
    console.log('[Interaction]', interaction.customId);

    try {
      /* ======================================================
         🔒 PAINEL STAFF (ISOLADO)
      ====================================================== */
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

      /* ======================================================
         SLASH COMMANDS
      ====================================================== */
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
        }
        return;
      }

      /* ======================================================
         BOTÕES
      ====================================================== */
      if (interaction.isButton()) {

        /* ---------- PIX COPIA E COLA ---------- */
        if (interaction.customId.startsWith('pix_copia_')) {

          const pixId = interaction.customId.replace('pix_copia_', '');
          const registro = await PixModel.findById(pixId);

          if (!registro || registro.status === 'EXPIRADO') {
            return interaction.reply({
              content: '❌ Este PIX expirou ou não existe mais.',
              ephemeral: true
            });
          }

          return interaction.reply({
            ephemeral: true,
            embeds: [
              new EmbedBuilder()
                .setTitle('📋 PIX Copia e Cola')
                .setDescription(
                  'Copie **todo o código abaixo** e cole diretamente no aplicativo do banco:\n\n' +
                  '```' + registro.codigoPix + '```'
                )
                .setColor(config.color)
                .setFooter({ text: 'PIX válido até expirar.' })
            ]
          });
        }

        /* ---------- VOLTAR REGRAS (SE AINDA EXISTIR) ---------- */
        if (interaction.customId === 'regras_voltar') {

          const embedPrincipal = new EmbedBuilder()
            .setTitle('📜 Central de Regras')
            .setDescription(
              'Selecione no menu abaixo qual conjunto de regras deseja visualizar.\n\n' +
              '⚠️ A leitura é registrada automaticamente.'
            )
            .setColor(config.color);

          const menu = new StringSelectMenuBuilder()
            .setCustomId('menu_regras')
            .setPlaceholder('📂 Escolha um tipo de regra')
            .addOptions([
              { label: 'Regras da Cidade', value: 'cidade', emoji: '🏙️' },
              { label: 'Regras de Convivência', value: 'convivencia', emoji: '🤝' },
              { label: 'Regras Gerais', value: 'gerais', emoji: '📌' },
              { label: 'Regras do Discord', value: 'discord', emoji: '💬' }
            ]);

          return interaction.update({
            embeds: [embedPrincipal],
            components: [new ActionRowBuilder().addComponents(menu)]
          });
        }

        return;
      }

      /* ======================================================
         STRING SELECT MENU (REGRAS → EPHEMERAL)
      ====================================================== */
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

        return interaction.reply({
          ephemeral: true,
          embeds: [
            new EmbedBuilder()
              .setDescription(texto)
              .setColor(config.color)
              .setFooter({ text: 'Leitura registrada automaticamente.' })
          ]
        });
      }

      /* ======================================================
         MODALS (PIX)
      ====================================================== */
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

          const codigoPix = pix.getQRCodeText();

          const canvas = Canvas.createCanvas(1200, 1200);
          const ctx = canvas.getContext('2d');

          const qr = await Canvas.loadImage(await pix.getQRCode());
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(qr, 0, 0, canvas.width, canvas.height);

          const registro = await PixModel.create({
            userId: interaction.user.id,
            produto,
            valor,
            chave,
            codigoPix,
            expiraEm: new Date(Date.now() + 10 * 60 * 1000)
          });

          const embed = new EmbedBuilder()
            .setTitle('💠 Pagamento via PIX')
            .setImage('attachment://qrcode.png')
            .setColor(config.color)
            .addFields(
              { name: '🛒 Produto', value: produto },
              { name: '💰 Valor', value: `R$ ${valor.toFixed(2)}` }
            );

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`pix_copia_${registro._id}`)
              .setLabel('📋 PIX Copia e Cola')
              .setStyle(ButtonStyle.Success)
          );

          return interaction.reply({
            embeds: [embed],
            components: [row],
            files: [{ name: 'qrcode.png', attachment: canvas.toBuffer() }]
          });
        }
      }

    } catch (error) {
      console.error('InteractionCreate CRASH:', error);
    }
  }
};
      /* ======================================================*/