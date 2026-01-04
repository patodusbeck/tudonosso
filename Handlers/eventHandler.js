const fs = require('fs');
const path = require('path');
require('colors');

function loadEvents(client) {

    const eventsPath = path.join(__dirname, '../Events');
    const folders = fs.readdirSync(eventsPath);

    for (const folder of folders) {
        const folderPath = path.join(eventsPath, folder);

        const files = fs
            .readdirSync(folderPath)
            .filter(file => file.endsWith('.js'));

        for (const file of files) {
            const event = require(path.join(folderPath, file));

            if (event.once) {
                client.once(
                    event.name,
                    (...args) => event.execute(...args, client)
                );
            } else {
                client.on(
                    event.name,
                    (...args) => event.execute(...args, client)
                );
            }

            console.log(
                '✦ Evento'.cyan +
                ` ${event.name} em atividade.`
            );
        }
    }
}

module.exports = { loadEvents };
