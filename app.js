var SteamUser = require("steam-user");
var SteamTradeOfferManager = require("steam-tradeoffer-manager");
var SteamCommunity = require("steamcommunity");
var SteamTotp = require("steam-totp");

var settings = require("./settings");

let steamUser = {};
let steamCommunity = {};
let tradeManager = {};

settings.users.forEach((userSettings, userIndex) => {
    steamUser[userIndex] = new SteamUser();
    steamCommunity[userIndex] = new SteamCommunity();

    tradeManager[userIndex] = new SteamTradeOfferManager({
        steam: steamUser[userIndex],
        language: "en",
    });

    steamUser[userIndex].logOn({
        accountName: userSettings.username,
        password: userSettings.password,
        twoFactorCode: SteamTotp.getAuthCode(userSettings.shared_secret),
    });

    steamUser[userIndex].on("webSession", function (sessionID, cookies) {
        steamCommunity[userIndex].setCookies(cookies);
        tradeManager[userIndex].setCookies(cookies);
        console.log("cookies set");
    });

    steamUser[userIndex].on("loggedOn", () => {
        steamUser[userIndex].setPersona(0);
        console.log("logged on");
    });

    tradeManager[userIndex].on("newOffer", (offer) => {
        if (offer.message == settings.trade_key) {
            setTimeout(function () {
                getOffer(offer, userIndex);
            }, 10000);
        }
    });
});

function getOffer(offer, userIndex) {
    offer.update((err) => {
        if (err) throw err;
        if (offer.itemsToGive.length != 0 || offer.itemsToReceive.length != 1) {
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
                    for (var i = 0; i < inventory.length; i++) {
                        let item = inventory[i];
                        if (item.classid == offer.itemsToReceive[0].classid) {
                            var newOffer = tradeManager[userIndex].createOffer(
                                offer.partner
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
                }
            );
        });
    });
}

function checkConfirmation(id, userIndex) {
    var time = getTime();
    var identity = settings.users[userIndex].identity_secret;
    var confKey = SteamTotp.getConfirmationKey(identity, time, "conf");
    steamCommunity[userIndex].getConfirmations(
        time,
        confKey,
        (err, confirmations) => {
            if (err) throw err;
            confirmations.forEach((confirmation) => {
                if (confirmation.creator == id) {
                    var time = getTime();
                    var confKey = SteamTotp.getConfirmationKey(
                        identity,
                        time,
                        "allow"
                    );
                    confirmation.respond(time, confKey, true, (err) => {
                        if (err) throw err;
                    });
                }
            });
        }
    );
}

function getTime() {
    return Math.floor(Date.now() / 1000);
}
