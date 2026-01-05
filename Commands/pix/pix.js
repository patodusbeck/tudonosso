const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const { PIX } = require('gpix/dist');
const Canvas = require('canvas');
const mongoose = require('mongoose');
const config = require('../../config');

/* ================= MODEL ================= */
const PixSchema = new mongoose.Schema({
  userId: String,
  produto: String,
  valor: Number,
  chave: String,
  codigo: String,
  codigoPix: String,
  status: { type: String, default: 'PENDENTE' },
  criadoEm: { type: Date, default: Date.now },
  expiraEm: Date
});

const PixModel = mongoose.models.Pix || mongoose.model('Pix', PixSchema);

/* ================= COMMAND ================= */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('pix')
    .setDescription('🛒 Gerar QrCode de pagamento PIX')
    .addNumberOption(option =>
      option.setName('valor')
        .setDescription('Valor inteiro (ex: 50)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('descrição')
        .setDescription('Produto')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('chave')
        .setDescription('Chave PIX')
        .setRequired(true)
    ),

  async execute(interaction) {

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Você não tem permissão.',
        ephemeral: true
      });
    }

    const valor = interaction.options.getNumber('valor');
    const produto = interaction.options.getString('descrição');
    const chave = interaction.options.getString('chave');

    /* ⏳ EXPIRAÇÃO */
    const tempoExpiracao = 10 * 60 * 1000;
    const expiraEm = new Date(Date.now() + tempoExpiracao);
    const expiraTimestamp = `<t:${Math.floor(expiraEm.getTime() / 1000)}:R>`;

    /* 🔐 CÓDIGO */
    const codigo = `PIX-${Date.now().toString(36).toUpperCase()}`;

    /* 💠 GERA PIX */
    const pix = PIX.static()
      .setReceiverName(interaction.client.user.username.slice(0, 25))
      .setReceiverCity('Brasil')
      .setKey(chave)
      .setDescription(`${produto} | ${codigo}`)
      .setAmount(valor);

    const codigoPix = await pix.getBRCode(); // ✅ CORRETO

    /* 💾 SALVA */
    const registro = await PixModel.create({
      userId: interaction.user.id,
      produto,
      valor,
      chave,
      codigo,
      codigoPix,
      expiraEm
    });

    /* 🖼️ QR CODE */
    const canvas = Canvas.createCanvas(1200, 1200);
    const ctx = canvas.getContext('2d');

    const qr = await Canvas.loadImage(await pix.getQRCode());
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(qr, 0, 0, canvas.width, canvas.height);

    /* 📦 EMBED */
    const embed = new EmbedBuilder()
      .setTitle('💠 Pagamento via PIX')
      .setThumbnail(config.thumbnail)
      .setImage('attachment://qrcode.png')
      .setColor(config.color)
      .addFields(
        { name: '🛒 Produto', value: produto },
        { name: '💰 Valor', value: `R$ ${valor.toFixed(2)}` },
        { name: '🔐 Código', value: codigo },
        { name: '⏳ Expira em', value: expiraTimestamp }
      )
      .setFooter({
        text: 'Após expirar, gere um novo PIX.',
        iconURL: config.thumbnail
      });

    /* 🔘 BOTÃO COPIA E COLA */
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`pix_copia_${registro._id}`)
        .setLabel('📋 PIX Copia e Cola')
        .setStyle(ButtonStyle.Primary)
    );

    const mensagem = await interaction.reply({
      embeds: [embed],
      components: [row],
      files: [{
        name: 'qrcode.png',
        attachment: canvas.toBuffer()
      }],
      fetchReply: true
    });

    /* ⛔ AUTO EXPIRA */
    setTimeout(async () => {
      try {
        await PixModel.updateOne(
          { _id: registro._id },
          { status: 'EXPIRADO' }
        );

        const expiredEmbed = EmbedBuilder.from(embed)
          .setTitle('⛔ PIX EXPIRADO')
          .setColor('Red')
          .setFooter({ text: 'Este pagamento não é mais válido.' });

        await mensagem.edit({
          embeds: [expiredEmbed],
          components: []
        });
      } catch (err) {
        console.log('Erro ao expirar PIX:', err.message);
      }
    }, tempoExpiracao);
  }
};
module.exports.PixModel = PixModel;
