/*!
 * Divine-Asuriel
 *
 * 
 * Autor: Vasikokk (@cvasilivg)
 * 
 * Divine Asuriel es un bot que envía mensajes embebidos 
 * con información de la base de datos proporcionada por 
 * Divine Pride del juego Ragnarok Online.
 * 
 * Divine Asuriel is a bot that sends messages embedded with 
 * information from the database provided by Divine Pride 
 * from game Ragnarok Online.
 */


/*!
 * Libreries
 */
const Discord = require('discord.js');
const bot = new Discord.Client();
const axios = require('axios');
const fetch = require('node-fetch');
const cheerio = require("cheerio");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 100, checkperiod: 120 });


/*!
 * Config file
 * 
 * 
 * Divine Pride API <https://divine-pride.net/api/>
 * Discord Token <https://discord.com/developers/applications>
 */
const { apiDivine, tokenDiscord } = require('./config.json');


/*!
 * Commands
 */
const prefix = {
    'item': 'a!item',
    'monster': 'a!monster',
    'skill': 'a!skill',
    'version': 'a!version'
};


/*!
 * Función Asincrónica getDataByID
 *
 * Busca en la API por ID
 */
async function getDataByID(url, cacheSection, idName) {
    let response = await fetch(url);

    if (await response.status !== 200) {
        return {};
    };

    let json = await response.json();

    cache_success = cache.set(`${cacheSection}.${idName}`, json, 10000);

    return json;
};


/*!
 * Función getDataByName
 *
 * Busca en el buscador de la web por el nombre, para sacar su id y usar la función
 * getDataByID para devolver el json con la información
 */
async function getDataByName(name, section, url_section, cache_section) {
    let url = `https://divine-pride.net/database/search?q=${name}`;
    let response = await axios.get(url);
    let $ = await cheerio.load(response.data);
    let arrayDataTable = [];

    // section es el xpath que se le pasa por parámetro para buscar el id en el buscador
    // y lo almacena en un array
    $(section).each((index, element) => {
        arrayDataTable[index] = $(element).attr('href');
    });

    // si el array es mayor que 0 es que ha localizado el id por el nombre introducido
    // hago un split para convertir todos los elementos href del array y obtenemos el id y el nombre
    // y hace uso de la función getDataByID para recuperar la info y parsearlo en un mensaje embebido
    if (arrayDataTable.length > 0) {
        for (let item of arrayDataTable) {
            let arrayItem = item.split('/');
    
            if (arrayItem[4] === name.replace('+', '-')) {
                let cacheValue = cache.get(`${cache_section}.${arrayItem[3]}`);

                if (cacheValue !== undefined) {
                    console.log("Monstrando JSON via CACHE");
                    return await cacheValue;
                } else {
                    let urlSection = `${url_section}${arrayItem[3]}?apiKey=${apiDivine}`;

                    return await getDataByID(urlSection, cache_section, arrayItem[3]);
                };
            };
        }
    } else {
        // si no lo recupera por que hayan pasado el id directamente por comando
        // en Discord 'Apple' o '512' lo interpreta como string
        let cacheValue = cache.get(`${cache_section}.${name}`);
        let urlSection = `${url_section}${name}?apiKey=${apiDivine}`;

        if (cacheValue !== undefined) {
            console.log("Monstrando JSON via CACHE");
            return await cacheValue;
        } else {
            return await getDataByID(urlSection, cache_section, name);
        };
    };
};


// Command Item
bot.on('message', async (msg) => {
    let username = msg.author.toString();

    let idNameItem = msg.content.slice(7).replace(' ', '+').toLowerCase();
    let section = `body > div > div > div > div > div > div#items > table > tbody > tr > td > a`;
    let url_section = `https://divine-pride.net/api/database/Item/`;

    if (msg.content.startsWith(prefix['item'])) {
        let dataItem = await getDataByName(idNameItem, section, url_section, 'item');
        
        if (dataItem !== undefined) {
            if (Object.entries(dataItem).length != 0) {
                let { id, name, unidName, description } = dataItem;
    
                try {
                    await msg.channel.send({
                        embed: {
                            color: 3447003,
                            author: {
                                name: name,
                                icon_url: `https://www.divine-pride.net/img/items/item/iRO/${id}` 
                            },
                            description: 'Item',
                            fields: [
                                {
                                    name: 'ID',
                                    value: id,
                                    inline: true,
                                },
                                {
                                    name: 'Name',
                                    value: name,
                                    inline: true,
                                },
                                {
                                    name: 'Unid Name',
                                    value: unidName,
                                    inline: true,
                                },
                                {
                                    name: 'Description',
                                    value: description.replace(/\^[a-zA-Z - 0-9]{6}/g, ''),
                                    inline: true,
                                }
                            ],
                            footer: {
                                icon_url: 'https://static.divine-pride.net/images/divinepride.png',
                                text: 'Divine Pride API'
                            }
                        }
                    });
                    // await testMessage.delete({ timeout: 1000 });
                } catch (error) {
                    process.on("unhandledRejection", error => console.error("Promise rejection:", error));
                };
            } else {
                // por si no lo encuentra
                msg.channel.send(username + ' Lo siento, no pude encontrar el nombre del objeto :(');
            };
        } else {
            // por si da null
            msg.channel.send(username + ' Lo siento, no pude encontrar el nombre del objeto :(');
        };
    };
});


// Command Monster
bot.on('message', async (msg) => {
    let username = msg.author.toString();

    let idNameMonster = msg.content.slice(10).replace(' ', '+').toLowerCase();
    let section = `body > div > div > div > div > div > div#monster > table > tbody > tr > td > span > a`;
    let url_section = `https://divine-pride.net/api/database/Monster/`;

    if (msg.content.startsWith(prefix['monster'])) {
        let dataMonster = await getDataByName(idNameMonster, section, url_section, 'monster');

        if (dataMonster !== undefined) {
            if (Object.entries(dataMonster).length != 0) {
                // Section Monster JSON
                let {
                    id, 
                    dbname, 
                    name, 
                } = dataMonster;
    
                // Section Monster Stats JSON
                let {
                    attackRange, 
                    level, 
                    health, 
                    sp, 
                    str, 
                    int, 
                    vit,
                    dex, 
                    agi, 
                    luk, 
                    attack, 
                    magicAttack, 
                    defense, 
                    magicDefense, 
                    hit, 
                    flee 
                } = dataMonster.stats;
    
                // Section Monster Attack and Magic Attack Stats JSON
                let attackMinimum = attack.minimum;
                let attackMaximum = attack.maximum;
                let magicAttackMinimum = magicAttack.minimum;
                let magicAttackMaximum = magicAttack.maximum;
    
                try {
                    await msg.channel.send({
                        embed: {
                            color: 3447003,
                            author: {
                                name: name,
                                icon_url: `https://static.divine-pride.net/images/mobs/png/${id}.png`
                            },
                            description: 'Monster',
                            fields: [
                                {
                                    name: 'ID',
                                    value: id,
                                    inline: true,
                                },
                                {
                                    name: 'DBname',
                                    value: dbname,
                                    inline: true,
                                },
                                {
                                    name: 'Name',
                                    value: name,
                                    inline: true,
                                },
                                {
                                    name: 'Stats',
                                    value: `Attack Range: ${attackRange}
                                            Level: ${level}
                                            Health: ${health}
                                            `,
                                    inline: true,
                                },
                                {
                                    name: 'General Stats',
                                    value: `SP: ${sp}
                                            STR: ${str}
                                            INT: ${int}
                                            VIT: ${vit}
                                            DEX: ${dex}
                                            AGI: ${agi}
                                            LUK: ${luk}
                                            `,
                                    inline: true,
                                },
                                {
                                    name: 'Attack Stats',
                                    value: `Attack Minimum: ${attackMinimum}
                                            Attack Maximum: ${attackMaximum}
                                            Magic Attack Minimum: ${magicAttackMinimum}
                                            Magic Attack Maximum: ${magicAttackMaximum}
                                            `,
                                    inline: true,
                                },
                                {
                                    name: 'Other Stats',
                                    value: `Defense: ${defense}
                                            Magic Defense: ${magicDefense}
                                            Hit: ${hit}
                                            Flee: ${flee}
                                            `,
                                    inline: true,
                                },
                            ],
                            footer: {
                                icon_url: 'https://static.divine-pride.net/images/divinepride.png',
                                text: 'Divine Pride API'
                            }
                        }
                    });
                    // await testMessage.delete({ timeout: 1000 });
                } catch (error) {
                    process.on("unhandledRejection", error => console.error("Promise rejection:", error));
                };
            } else {
                // Por si no lo encuentra
                msg.channel.send(username + ' Lo siento, no pude encontrar el nombre del monstruo :(');
            };
        } else {
            // Por si da null
            msg.channel.send(username + ' Lo siento, no pude encontrar el nombre del monstruo :(');
        }
    };
});


// Command Skill
bot.on('message', async (msg) => {
    let username = msg.author.toString();

    let idNameSkill = msg.content.slice(8).replace(' ', '+').toLowerCase();
    let section = `body > div > div > div > div > div > div#skill > table > tbody > tr > td > a`;
    let url_section = `https://divine-pride.net/api/database/Skill/`;

    if (msg.content.startsWith(prefix['skill'])) {
        let dataSkill = await getDataByName(idNameSkill, section, url_section, 'skill');
        
        if (dataSkill !== undefined) {
            if (Object.entries(dataSkill).length != 0) {
                let { id, name, description } = dataSkill;

                try {
                    await msg.channel.send({
                        embed: {
                            color: 3447003,
                            author: {
                                name: name,
                                icon_url: `https://static.divine-pride.net/images/skill/${id}.png` 
                            },
                            description: 'Skill',
                            fields: [
                                {
                                    name: 'ID',
                                    value: id,
                                    inline: true,
                                },
                                {
                                    name: 'Name',
                                    value: name,
                                    inline: true,
                                },
                                {
                                    name: 'Description',
                                    value: description.replace(/\^[a-zA-Z - 0-9]{6}/g, ''),
                                    inline: true,
                                }
                            ],
                            footer: {
                                icon_url: 'https://static.divine-pride.net/images/divinepride.png',
                                text: 'Divine Pride API'
                            }
                        }
                    });
                    // await testMessage.delete({ timeout: 1000 });
                } catch (error) {
                    process.on("unhandledRejection", error => console.error("Promise rejection:", error));
                };
            } else {
                // por si no lo encuentra
                msg.channel.send(username + ' Lo siento, no pude encontrar el nombre de la habilidad :(');
            };
        } else {
            // por si da null
            msg.channel.send(username + ' Lo siento, no pude encontrar el nombre de la habilidad :(');
        };
    };
});


// Command Version
bot.on('message', async (msg) => {
    if (msg.content.startsWith(prefix['version'])) {
        await msg.channel.send({
            embed: {
                color: 3447003,
                author: {
                    name: 'Divine Asuriel'
                },
                description: 'Divine Asuriel Bot',
                fields: [
                    {
                        name: 'Autor',
                        value: 'Carlos Vasili Viñuela Garcia',
                        inline: true,
                    },
                    {
                        name: 'Version',
                        value: '1.1.3',
                        inline: true,
                    },
                    {
                        name: 'Comandos',
                        value: `a!item Nombre del Objeto
                                a!monster Nombre del Monstruo
                                a!skill Nombre de la Habilidad
                                a!version`,
                        inline: true,
                    }
                ],
                footer: {
                    text: 'Ragnarok Online'
                }
            }
        });
    };
});


/*!
 * Función login
 */
bot.login(tokenDiscord).catch(
    process.on("unhandledRejection", error => console.error("Promise rejection:", error))
);


/*!
 * Función once
 */
bot.once('ready', () => {
	console.log('Divine Asuriel now is Online!');
});
