const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = (client) => {

  // Função para enviar erro para o canal de logs
  async function sendError(type, error) {
    try {
      const channel = client.channels.cache.get(config.errorChannel);
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle('🚨 Erro Detectado')
        .setColor('Red')
        .addFields(
          { name: '📌 Tipo', value: type },
          {
            name: '❌ Erro',
            value: `\`\`\`${String(error?.message || error).slice(0, 1000)}\`\`\``
          },
          {
            name: '🧠 Stack',
            value: `\`\`\`${(error?.stack || 'Sem stack').slice(0, 1500)}\`\`\``
          }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });

    } catch (e) {
      console.error('[AntiCrash] Falha ao enviar log:', e);
    }
  }

  /* ============================================================
     🔴 PROMISE NÃO TRATADA
  ============================================================ */
  process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
    sendError('unhandledRejection', reason);
  });

  /* ============================================================
     🔴 ERRO FATAL
  ============================================================ */
  process.on('uncaughtException', (error) => {
    console.error('[uncaughtException]', error);
    sendError('uncaughtException', error);
  });

  /* ============================================================
     🔴 ERROS DO DISCORD
  ============================================================ */
  client.on('error', (error) => {
    console.error('[Discord Error]', error);
    sendError('Discord.js Error', error);
  });

  client.on('warn', (warning) => {
    console.warn('[Discord Warning]', warning);
  });

};
