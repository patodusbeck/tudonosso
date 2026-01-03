const Discord = require('discord.js');
const {SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType} = require('discord.js');
const { PIX } = require('gpix/dist');
const Canvas = require('canvas');
const config = require('../../config');

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('pix')
        .setDescription('🛒 Gerar QrCode.')
        .addNumberOption(option =>
            option.setName('valor')
                .setDescription('✦ Preço da Doação. (NÃO USE PONTO OU VIRGULA! COLOQUE O NUMERO INTEIRO)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('descrição')
                .setDescription('✦ Produtos')
                .setRequired(true)
                .addChoices(
                    { name: "🛒 VIP Prime - 30 Dias", value: "🛒 VIP Prime - 30 Dias"},
                    { name: "🛒 VIP Ghast- 30 Dias", value: "🛒 VIP Ghast - 30 Dias" },
                    { name: "🛒 VIP Rainbow - 30 Dias", value: "🛒 VIP Rainbow - 30 Dias"},
                    { name: "🛒 VIP Advanced - 30 Dias", value: "🛒 VIP Advanced - 30 Dias" },
                    { name: "🛒 VIP Legendary - 30 Dias", value: "🛒 VIP Legendary - 30 Dias" },
                    { name: "🛒 VIP Patrocinador - 30 Dias", value: "🛒 VIP Patrocinador - 30 Dias" },
                    { name: "🛒 Unban por máximo de punições", value: "🛒 Unban por máximo de punições"},
                    { name: "🛒 Unban Comercio Ilegal", value: "🛒 Unban Comercio Ilegal"},
                    { name: "🛒 Unban Dark RP", value: "🛒 Unban Dark RP"},
                    { name: "🛒 Registros (ID)", value: "🛒 Registros (ID) - Até o final da Season" },
                    { name: "🛒 Base Privada  - 30 dias", value: "🛒 Base Privada  - 30 dias" },
                    { name: "🛒 Skin Privada  - 30 dias", value: "🛒 Skin Privada  - 30 dias" },
                    { name: "🛒 PCoins", value: "🛒 PCoins" },
                )
        )
        .addStringOption(option =>
            option.setName('chave')
                .setDescription('✦ Chave Pix Para receber a doação.')
                .setRequired(true)
        ),
    async execute(interaction) {

        if (!interaction.member.permissions.has("ADMINISTRATOR")) {
            return interaction.reply({content: `Você não tem permissão para executar este comando.`, ephemeral: true});
        }
                  
        const valor = interaction.options.getNumber('valor');
        const desc = interaction.options.getString('descrição')
        const chave = interaction.options.getString('chave')
        
        const pix = PIX.static().setReceiverName(interaction.client.user.username)
            .setReceiverCity('Brasil')
            .setKey(chave)
            .setDescription(desc)
            .setAmount(valor);

            const canvas = Canvas.createCanvas(1200, 1200);
            const context = canvas.getContext('2d');
            const qrCodeImage = await Canvas.loadImage(await pix.getQRCode());
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(qrCodeImage, 0, 0, canvas.width, canvas.height);

            const repost = new Discord.EmbedBuilder()
            .setTitle('QrCode gerado com sucesso!') 
            .setThumbnail(config.thumbnail)
            .setDescription(`A chave pix que você enviou foi \n **${chave}** \n Caso a chave pix tiver escrita incorretamente, o pix não irá funcionar.`)
            .setColor(config.color)
            .setFooter({ text: 'Bcc Roleplay © 2026 ', iconURL: config.thumbnail });

        await interaction.reply({ embeds: [repost], ephemeral: true });

        const embed = new Discord.EmbedBuilder()
            .setTitle(`Benefícios Premium`)
            .setThumbnail(config.thumbnail)
            .setImage(`attachment://qrcode.png`)
            //.setFooter({ text: 'Bcc Roleplay © 2026 ', iconURL: config.thumbnail })
            .setFooter({ text: 'Após realizar a doação, envie o comprovante para agilizar o atendimento. ', iconURL: config.thumbnail })
            .addFields(
                { name: '<:Foguete:1081423107488751626> Produto' , value: `${desc}` },
                { name: '<:sackdollar:1122367809041748049> Valor da Doação', value: `R$${valor.toFixed(2)}` },
               // { name: '<:info:1122365966370746469> Doação', value: 'Após realizar a doação, envie o comprovante para agilizar o atendimento.' },
            )
            //.setDescription(`Item: ${desc}`)
            .setColor(config.color);

        await interaction.followUp({
            embeds: [embed],
            files: [{
                name: 'qrcode.png',
                attachment: canvas.toBuffer()
            }]
        });

      /*  const repost = new Discord.EmbedBuilder()
            .setTitle('QrCode gerado com sucesso!') 
            .setThumbnail(config.thumbnail)
            .setDescription(`A chave pix que você enviou foi \n **${chave}** \n Caso a chave pix tiver escrita incorretamente, o pix não irá funcionar.`)
            .setColor(config.color)
            .setFooter({ text: 'Bcc Roleplay © 2026 ', iconURL: config.thumbnail });

        await interaction.followUp({ embeds: [repost], ephemeral: true });*/

        //await interaction.reply({content: `A chave pix que você enviou foi \n **${chave}** \n Caso a chave pix tiver escrita incorretamente, o pix não irá funcionar.`, ephemeral: true})
    }
}

// Feito por PatoDusBeck

