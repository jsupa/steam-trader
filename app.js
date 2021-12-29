const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const TradeOfferManager = require('steam-tradeoffer-manager');

const settings = require('./settings.json');

const steamUser = {};
const steamCommunity = {};
const tradeManager = {};

function getTime() {
    const time = new Date();
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    const day = time.getDate();
    const month = time.getMonth();
    const year = time.getFullYear();
    return `[${year}-${month}-${day} ${hours}:${minutes}:${seconds}]`;
}

settings.users.forEach((userSettings, userIndex) => {
    setTimeout(() => {
        steamUser[userIndex] = new SteamUser();
        steamCommunity[userIndex] = new SteamCommunity();
        tradeManager[userIndex] = new TradeOfferManager({
            steam: steamUser[userIndex],
            domain: 'localhost',
            language: 'en',
        });

        const userInfo = {
            accountName: userSettings.accountName,
            password: userSettings.password,
            twoFactorCode: SteamTotp.getAuthCode(userSettings.sharedSecret),
        };

        steamUser[userIndex].logOn(userInfo);

        steamUser[userIndex].on('loggedOn', () => {
            console.log(`${getTime()} ${userInfo.accountName} logged on`);
            steamUser[userIndex].setPersona(SteamUser.EPersonaState.Online);
            steamUser[userIndex].gamesPlayed(753);
        });

        steamUser[userIndex].on('webSession', (sessionID, cookies) => {
            steamCommunity[userIndex].setCookies(cookies);
            tradeManager[userIndex].setCookies(cookies, (err) => {
                if (err) throw err;
                console.log(`${getTime()} ${userInfo.accountName} sookies set`);
                if (userIndex === 0) {
                    createOffers(userIndex, userSettings);
                }
            });
        });

        tradeManager.on('newOffer', (offer) => {
            if (
                offer.message.toString() === settings.trade_key &&
                offer.itemsToGive.length === 0
            ) {
                console.log(
                    `${getTime()} ${userInfo.username} got offer : ${offer.id}`,
                );
                setTimeout(() => {
                    if (offer.message === settings.trade_key) {
                        getOffer(offer, userIndex, userSettings);
                    }
                }, 5000);
            }
        });
    }, userIndex * 5000);
});

function createOffers(userIndex, userSettings) {
    tradeManager[userIndex].getInventoryContents(
        settings.appid,
        settings.context_id,
        true,
        (err, inventory) => {
            if (err) throw err;
            const trade = {};
            settings.users.forEach((tradeUserSettings, tradeUserIndex) => {
                trade[tradeUserIndex] = tradeManager[userIndex].createOffer(
                    tradeUserSettings.trade_url,
                );
                inventory.forEach((item) => {
                    const itemName = item.market_hash_name.toLoweCase();
                    if (itemName.includes(tradeUserSettings.item_name)) {
                        trade[tradeUserIndex].addMyItem(item);
                    } else if (item === inventory.length - 1) {
                        console.log(
                            `${getTime()} ${
                                userSettings.username
                            } could not find a item.`,
                        );
                    }
                });
                trade[tradeUserIndex].setMessage(settings.trade_key);
                trade[tradeUserIndex].send((err, status) => {
                    if (err) throw err;
                    if (status === 'pending') {
                        console.log(
                            `${getTime()} ${
                                userSettings.username
                            } offer created.`,
                        );
                        steamCommunity[userIndex].acceptConfirmationForObject(
                            settings.users[userIndex].identity_secret,
                            trade[tradeUserIndex].id,
                            (err) => {
                                if (err) throw err;
                                console.log(
                                    `${getTime()} ${
                                        userSettings.username
                                    } accepted confirmation.`,
                                );
                            },
                        );
                    }
                });
            });
        },
    );
}

function getOffer(offer, userIndex, userSettings) {
    offer.accept((err) => {
        if (err) throw err;
        console.log(
            `${getTime()} ${userSettings.username} accepted offer : ${
                offer.id
            }`,
        );
        tradeManager[userIndex].getInventoryContents(
            settings.appid,
            settings.contextid,
            true,
            (err, inventory) => {
                if (err) throw err;
                for (let i = 0; i < inventory.length; i++) {
                    const item = inventory[i];
                    if (item.classid === offer.itemsToReceive[0].classid) {
                        const newOffer = tradeManager[userIndex].createOffer(
                            offer.partner,
                        );
                        newOffer.addMyItem(item);
                        newOffer.setMessage(settings.trade_key);
                        newOffer.send((err) => {
                            if (err) throw err;
                            checkConfirmation(newOffer.id, userIndex);
                        });
                        break;
                    }
                }
            },
        );
    });
}
function checkConfirmation(id, userIndex) {
    const time = getTime();
    const identity = settings.users[userIndex].identity_secret;
    const confKey = SteamTotp.getConfirmationKey(identity, time, 'conf');
    steamCommunity[userIndex].getConfirmations(
        time,
        confKey,
        (err, confirmations) => {
            if (err) throw err;
            confirmations.forEach((confirmation) => {
                if (confirmation.creator === id) {
                    const time = getTime();
                    const confKey = SteamTotp.getConfirmationKey(
                        identity,
                        time,
                        'allow',
                    );
                    confirmation.respond(time, confKey, true, (err) => {
                        if (err) throw err;
                    });
                }
            });
        },
    );
}
