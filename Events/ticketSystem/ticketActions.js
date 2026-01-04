const {
    EmbedBuilder,
    PermissionFlagsBits,
    UserSelectMenuBuilder,
    ActionRowBuilder
} = require('discord.js');

const { createTranscript } = require('discord-html-transcripts');

const TicketSetup = require('../../Schemas/TicketSetup');
const TicketSchema = require('../../Schemas/Ticket');
const config = require('../../config');

module.exports = {
    name: 'interactionCreate',

    async execute(interaction) {
        if (!interaction.isButton()) return;

        const { guild, member, customId, channel } = interaction;
        const { ManageChannels } = PermissionFlagsBits;

        if (!['ticket-close', 'ticket-manage', 'ticket-claim'].includes(customId)) return;

        const docs = await TicketSetup.findOne({ GuildID: guild.id });
        if (!docs) return;

        const nopermissionsEmbed = new EmbedBuilder()
            .setColor(config.color)
            .setDescription(config.ticketNoPermissions);

        const executeEmbed = new EmbedBuilder().setColor(config.color);
        const alreadyEmbed = new EmbedBuilder().setColor(config.color);

        const data = await TicketSchema.findOne({
            GuildID: guild.id,
            ChannelID: channel.id
        });
        if (!data) return;

        switch (customId) {

            // ❌ FECHAR TICKET
            case 'ticket-close': {
                if (
                    !member.permissions.has(ManageChannels) &&
                    !member.roles.cache.has(docs.Handlers)
                ) {
                    return interaction.reply({ embeds: [nopermissionsEmbed], ephemeral: true });
                }

                const transcript = await createTranscript(channel, {
                    limit: -1,
                    returnType: 'attachment',
                    saveImages: true,
                    poweredBy: false,
                    filename: `${config.ticketName}${data.TicketID}.html`
                });

                const claimed = data.Claimed ? '✅' : '❌';
                const claimedBy = data.ClaimedBy ? `<@${data.ClaimedBy}>` : '❌';
                const timestamp = Math.round(Date.now() / 1000);

                const transcriptEmbed = new EmbedBuilder().setDescription(
                    `${config.ticketTranscriptMember} <@${data.OwnerID}>\n` +
                    `${config.ticketTranscriptTicket} ${data.TicketID}\n` +
                    `${config.ticketTranscriptClaimed} ${claimed}\n` +
                    `${config.ticketTranscriptModerator} ${claimedBy}\n` +
                    `${config.ticketTranscriptTime} <t:${timestamp}:F>`
                );

                await guild.channels.cache.get(docs.Transcripts)?.send({
                    embeds: [transcriptEmbed],
                    files: [transcript]
                });

                await interaction.deferUpdate();

                await channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(config.ticketCloseTitle)
                            .setDescription(config.ticketCloseDescription)
                            .setColor(config.color)
                    ]
                });

                await TicketSchema.deleteOne({
                    GuildID: guild.id,
                    ChannelID: channel.id
                });

                setTimeout(() => channel.delete().catch(() => {}), 5000);
                break;
            }

            // 👤 GERENCIAR MEMBRO
            case 'ticket-manage': {
                if (
                    !member.permissions.has(ManageChannels) &&
                    !member.roles.cache.has(docs.Handlers)
                ) {
                    return interaction.reply({ embeds: [nopermissionsEmbed], ephemeral: true });
                }

                const menu = new UserSelectMenuBuilder()
                    .setCustomId('ticket-manage-menu')
                    .setPlaceholder(
                        config.ticketManageMenuEmoji + config.ticketManageMenuTitle)
                    .setMinValues(1)
                    .setMaxValues(1);

                return interaction.reply({
                    components: [new ActionRowBuilder().addComponents(menu)],
                    ephemeral: true
                });
            }

            // 🏷️ CLAIMAR TICKET
            case 'ticket-claim': {
                if (
                    !member.permissions.has(ManageChannels) &&
                    !member.roles.cache.has(docs.Handlers)
                ) {
                    return interaction.reply({ embeds: [nopermissionsEmbed], ephemeral: true });
                }

                if (data.Claimed) {
                    alreadyEmbed.setDescription(
                        `${config.ticketAlreadyClaim} <@${data.ClaimedBy}>`
                    );
                    return interaction.reply({ embeds: [alreadyEmbed], ephemeral: true });
                }

                await TicketSchema.updateOne(
                    { ChannelID: channel.id },
                    { Claimed: true, ClaimedBy: member.id }
                );

                await channel.edit({
                    name: `${config.ticketCheck}・${channel.name}`,
                    topic: `${channel.topic}${config.ticketDescriptionClaim}<@${member.id}>`
                });

                executeEmbed
                    .setTitle('Central de Suporte')
                    .setDescription(config.ticketSuccessClaim);

                await interaction.deferUpdate();
                await channel.send({ embeds: [executeEmbed] });
                break;
            }
        }
    }
};
