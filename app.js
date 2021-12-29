const SteamUser = require('steam-user');
const SteamTradeOfferManager = require('steam-tradeoffer-manager');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');

const settings = require('./settings.json');

const steamUser = {};
const steamCommunity = {};
const tradeManager = {};

settings.users.forEach((userSettings, userIndex) => {
    setTimeout(() => {
        steamUser[userIndex] = new SteamUser();
        steamCommunity[userIndex] = new SteamCommunity();

        tradeManager[userIndex] = new SteamTradeOfferManager({
            steam: steamUser[userIndex],
            language: 'en',
        });

        steamUser[userIndex].logOn({
            accountName: userSettings.username,
            password: userSettings.password,
            twoFactorCode: SteamTotp.getAuthCode(userSettings.shared_secret),
        });

        steamUser[userIndex].on('webSession', (sessionID, cookies) => {
            steamCommunity[userIndex].setCookies(cookies);
            tradeManager[userIndex].setCookies(cookies);
            console.log('cookies set');
        });

        steamUser[userIndex].on('loggedOn', () => {
            steamUser[userIndex].setPersona(0);
            console.log('logged on');
        });

        tradeManager[userIndex].on('newOffer', (offer) => {
            setTimeout(() => {
                if (offer.message === settings.trade_key) {
                    getOffer(offer, userIndex);
                }
            }, 10000);
        });
    }, userIndex * 1000 + 10000);
});

function getOffer(offer, userIndex) {
    offer.update((err) => {
        if (err) throw err;
        if (
            offer.itemsToGive.length !== 0 ||
            offer.itemsToReceive.length !== 1
        ) {
            offer.decline((err) => {
                if (err) throw err;
            });
            return;
        }
        offer.accept((err) => {
            if (err) throw err;
            tradeManager[userIndex].getInventoryContents(
                304930,
                2,
                true,
                (err, inventory) => {
                    if (err) throw err;
                    for (let i = 0; i < inventory.length; i++) {
                        const item = inventory[i];
                        if (item.classid === offer.itemsToReceive[0].classid) {
                            const newOffer = tradeManager[
                                userIndex
                            ].createOffer(offer.partner);
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

function getTime() {
    return Math.floor(Date.now() / 1000);
}
