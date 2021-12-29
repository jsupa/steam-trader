const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const TradeOfferManager = require('steam-tradeoffer-manager');

const settings = require('./settings.json');

const steamUser = {};
const steamCommunity = {};
const tradeManager = {};

const SECURITY_CODE = Math.floor(Math.random() * 99999 + 1);

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
            domain: 'example.com',
            language: 'en',
        });

        const userInfo = {
            accountName: userSettings.username,
            password: userSettings.password,
            twoFactorCode: SteamTotp.getAuthCode(userSettings.shared_secret),
        };

        steamUser[userIndex].logOn(userInfo);

        steamUser[userIndex].on('loggedOn', () => {
            console.log(`${getTime()} ${userSettings.username} logged on`);
            steamUser[userIndex].setPersona(SteamUser.EPersonaState.Online);
            steamUser[userIndex].gamesPlayed(753);
        });

        steamUser[userIndex].on('webSession', (sessionID, cookies) => {
            steamCommunity[userIndex].setCookies(cookies);
            tradeManager[userIndex].setCookies(cookies, (err) => {
                if (err) console.log(err);
                console.log(
                    `${getTime()} ${userSettings.username} sookies set`,
                );
                if (userIndex === 0) {
                    createOffers(userIndex, userSettings);
                }
            });
        });

        tradeManager[userIndex].on('newOffer', (offer) => {
            if (offer.itemsToGive.length === 0) {
                console.log(
                    `${getTime()} ${userSettings.username} got offer : ${
                        offer.id
                    }`,
                );
                setTimeout(() => {
                    if (offer.message === SECURITY_CODE.toString()) {
                        getOffer(offer, userIndex, userSettings);
                    } else {
                        acceptOrder(offer, userIndex, userSettings);
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
            if (err) console.log(err);
            const trade = {};
            settings.users
                .slice(1)
                .forEach((tradeUserSettings, tradeUserIndex) => {
                    trade[tradeUserIndex] = tradeManager[userIndex].createOffer(
                        tradeUserSettings.trade_url,
                    );
                    // eslint-disable-next-line no-restricted-syntax
                    for (const item of inventory) {
                        const itemName = item.market_hash_name.toLowerCase();
                        if (
                            itemName.includes(
                                tradeUserSettings.item_name.toLowerCase(),
                            )
                        ) {
                            trade[tradeUserIndex].addMyItem(item);
                            break;
                        } else if (item === inventory.length - 1) {
                            console.log(
                                `${getTime()} ${
                                    userSettings.username
                                } could not find a item.`,
                            );
                        }
                    }
                    trade[tradeUserIndex].setMessage(SECURITY_CODE.toString());
                    trade[tradeUserIndex].send((err, status) => {
                        if (err) console.log(err);
                        if (status === 'pending') {
                            console.log(
                                `${getTime()} ${
                                    userSettings.username
                                } offer created.`,
                            );
                            steamCommunity[
                                userIndex
                            ].acceptConfirmationForObject(
                                settings.users[userIndex].identity_secret,
                                trade[tradeUserIndex].id,
                                (err) => {
                                    if (err) console.log(err);
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
        if (err) console.log(err);
        console.log(
            `${getTime()} ${userSettings.username} accepted offer : ${
                offer.id
            }`,
        );
        tradeManager[userIndex].getInventoryContents(
            settings.appid,
            settings.context_id,
            true,
            (err, inventory) => {
                if (err) console.log(err);
                for (let i = 0; i < inventory.length; i++) {
                    const item = inventory[i];
                    if (item.classid === offer.itemsToReceive[0].classid) {
                        const newOffer = tradeManager[userIndex].createOffer(
                            offer.partner,
                        );
                        newOffer.addMyItem(item);
                        newOffer.setMessage(SECURITY_CODE.toString());
                        newOffer.send((err) => {
                            if (err) console.log(err);
                            console.log(
                                `${getTime()} ${
                                    userSettings.username
                                } create offer : ${newOffer.id}`,
                            );
                            checkConfirmation(newOffer.id, userIndex);
                        });
                        break;
                    }
                }
            },
        );
    });
}

function acceptOrder(offer, userIndex, userSettings) {
    offer.accept((err) => {
        if (err) console.log(err);
        console.log(
            `${getTime()} ${userSettings.username} accepted offer : ${
                offer.id
            }`,
        );
    });
}

function checkConfirmation(id, userIndex) {
    const time = getTimestamp();
    const identity = settings.users[userIndex].identity_secret;
    const confKey = SteamTotp.getConfirmationKey(identity, time, 'conf');
    steamCommunity[userIndex].getConfirmations(
        time,
        confKey,
        (err, confirmations) => {
            if (err) console.log(err);
            confirmations.forEach((confirmation) => {
                if (confirmation.creator === id) {
                    const time = getTimestamp();
                    const confKey = SteamTotp.getConfirmationKey(
                        identity,
                        time,
                        'allow',
                    );
                    confirmation.respond(time, confKey, true, (err) => {
                        if (err) console.log(err);
                    });
                }
            });
        },
    );
}

function getTimestamp() {
    return Math.floor(Date.now() / 1000);
}
