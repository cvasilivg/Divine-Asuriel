// My Ragnarok Online bot for Discord
// Version: 1.0.0
// Author: Vasikokk (@cvasilivg)


const Discord = require('discord.js');
const axios = require('axios');
const fetch = require('node-fetch');
const cheerio = require("cheerio");
const bot = new Discord.Client();


// Token from Divine-Pride
let apiDivinePride = '';


// Prefix for command
let prefixItem = 'a!item'; // len = 7
let prefixMonster = 'a!monster'; // len = 10
let prefixVersion = 'a!version'; // len = 10


async function getDataItemByID(itemID) {
    let urlItemAPI = `https://divine-pride.net/api/database/Item/${itemID}?apiKey=${apiDivinePride}`;
    let response = await fetch(urlItemAPI);
    let statusCode = await response.status;

    if (statusCode !== 200) {
        return {};
    };

    let jsonItem = await response.json();

    return jsonItem;
};


async function getDataItemByName(itemName) {
    let urlSearch = `https://divine-pride.net/database/search?q=${itemName}`;
    let response = await axios.get(urlSearch);
    let $ = await cheerio.load(response.data);
    let arrayItems = [];

    $("body > div > div > div > div > div > div#items > table > tbody > tr > td > a").each((index, element) => {
        arrayItems[index] = $(element).attr('href');
    });

    if (arrayItems.length > 0) {
        for (let item of arrayItems) {
            let listArrayItem = item.split('/');
    
            if (listArrayItem[4] === itemName.replace(/\+/g, '-')) {
                return await getDataItemByID(listArrayItem[3]);
            };
        }
    } else {
        return await getDataItemByID(itemName);
    };
};


async function getDataMonsterByID(itemID) {
    let urlItemAPI = `https://divine-pride.net/api/database/Monster/${itemID}?apiKey=${apiDivinePride}`;
    let response = await fetch(urlItemAPI);
    let statusCode = await response.status;

    if (statusCode !== 200) {
        return {};
    };

    let jsonItem = await response.json();

    return jsonItem;
};


async function getDataMonsterByName(monsterName) {
    let urlSearch = `https://divine-pride.net/database/search?q=${monsterName}`;
    let response = await axios.get(urlSearch);
    let $ = await cheerio.load(response.data);
    let arrayMonsters = [];

    $("body > div > div > div > div > div > div#monster > table > tbody > tr > td > span > a").each((index, element) => {
        arrayMonsters[index] = $(element).attr('href');
    });

    if (arrayMonsters.length > 0) {
        for (let monster of arrayMonsters) {
            let listArrayMonster = monster.split('/');
    
            if (listArrayMonster[4] === monsterName.replace(/\+/g, '-')) {
                return await getDataMonsterByID(listArrayMonster[3]);
            };
        }
    } else {
        return await getDataMonsterByID(monsterName);
    };
};


// Command Version
bot.on('message', async (msg) => {
    if (msg.content.startsWith(prefixVersion)) {
        await msg.channel.send({
            embed: {
                color: 3447003,
                author: {
                    name: 'Divine Asuriel'
                },
                description: 'Divine Asuriel Bot',
                fields: [
                    {
                        name: 'Author',
                        value: 'Vasikokk',
                        inline: true,
                    },
                    {
                        name: 'Version',
                        value: '1.1.3',
                        inline: true,
                    },
                    {
                        name: 'Commands',
                        value: `a!item Name
                                a!monster Name`,
                        inline: true,
                    }
                ],
                footer: {
                    text: 'Support Asuriel Ragnarok Online'
                }
            }
        });
    };
});


// Command Item
bot.on('message', async (msg) => {
    let username = msg.author.toString();

    let idNameItem = msg.content.slice(7).replace(/\s/g, '+').toLowerCase();

    if (msg.content.startsWith(prefixItem)) {
        let dataItem = await getDataItemByName(idNameItem);
        
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
                        title: 'Divine Pride API',
                        url: `https://www.divine-pride.net/database/item/${id}/`,
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
                            text: 'Support Divine Pride API'
                        }
                    }
                });
                /*await testMessage.delete({ timeout: 1000 });*/
            } catch (error) {
                process.on("unhandledRejection", error => console.error("Promise rejection:", error));
            };
        } else {
            msg.channel.send(username + ' Sorry I can´t find the item name :(');
        };
    };
});


// Command Monster
bot.on('message', async (msg) => {
    let username = msg.author.toString();

    let idNameMonster = msg.content.slice(10).replace(/\s/g, '+').toLowerCase();

    if (msg.content.startsWith(prefixMonster)) {
        let dataMonster = await getDataMonsterByName(idNameMonster);
        
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

            // Section Monster Drops JSON
            let monsterDrops = dataMonster.drops;

            // Len Monster Drops { Estoy cansado bro :( }
            /*let count_monster_drops = Object.keys(monster_drops).length;

            for (let idx_count_monster_drops = 0; idx_count_monster_drops < count_monster_drops; idx_count_monster_drops++) {
                // Get Item IDs - Drops
                if (monster_drops[idx_count_monster_drops].serverTypeName === 'Renewal') {
                    console.log(monster_drops[idx_count_monster_drops]);
                };
            }*/

            try {
                await msg.channel.send({
                    embed: {
                        color: 3447003,
                        author: {
                            name: name,
                            icon_url: `https://static.divine-pride.net/images/mobs/png/${id}.png`
                        },
                        title: 'Divine Pride API',
                        url: `https://www.divine-pride.net/database/monster/${id}/`,
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
                                value: `**Attack Range**: ${attackRange}
                                        **Level**: ${level}
                                        **Health**: ${health}
                                        `,
                                inline: true,
                            },
                            {
                                name: 'General Stats',
                                value: `**SP**: ${sp}
                                        **STR**: ${str}
                                        **INT**: ${int}
                                        **VIT**: ${vit}
                                        **DEX**: ${dex}
                                        **AGI**: ${agi}
                                        **LUK**: ${luk}
                                        `,
                                inline: true,
                            },
                            {
                                name: 'Attack Stats',
                                value: `**Attack Minimum**: ${attackMinimum}
                                        **Attack Maximum**: ${attackMaximum}
                                        **Magic Attack Minimum**: ${magicAttackMinimum}
                                        **Magic Attack Maximum**: ${magicAttackMaximum}
                                        `,
                                inline: true,
                            },
                            {
                                name: 'Other Stats',
                                value: `**Defense**: ${defense}
                                        **Magic Defense**: ${magicDefense}
                                        **Hit**: ${hit}
                                        **Flee**: ${flee}
                                        `,
                                inline: true,
                            },
                        ],
                        footer: {
                            icon_url: 'https://static.divine-pride.net/images/divinepride.png',
                            text: 'Support Divine Pride API'
                        }
                    }
                });
                /*await testMessage.delete({ timeout: 1000 });*/
            } catch (error) {
                process.on("unhandledRejection", error => console.error("Promise rejection:", error));
            };
        } else {
            msg.channel.send(username + ' Sorry I can´t find the monster name :(');
        };
    };
});


bot.once('ready', () => {
	console.log('Divine Asuriel are now Online!');
});


bot.login('').catch(
    process.on("unhandledRejection", error => console.error("Promise rejection:", error))
);
