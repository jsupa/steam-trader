const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const TradeOfferManager = require('steam-tradeoffer-manager');

const firstClient = new SteamUser();
const nr2Client = new SteamUser();
const nr3Client = new SteamUser();
const nr4Client = new SteamUser();

// Managers
const firstManager = new TradeOfferManager({
    steam: firstClient,
    domain: 'example.com',
    language: 'en',
});

function getTime() {
    const time = new Date();
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    const day = time.getDate();
    const month = time.getMonth();
    const year = time.getFullYear();
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const nr2Manager = new TradeOfferManager({
    steam: nr2Client,
    domain: 'example.com',
    language: 'en',
});
const nr3Manager = new TradeOfferManager({
    steam: nr3Client,
    domain: 'example.com',
    language: 'en',
});
const nr4Manager = new TradeOfferManager({
    steam: nr4Client,
    domain: 'example.com',
    language: 'en',
});

function doOfferMain(
    NameItem,
    tradeurl,
    identity,
    NameItem2,
    tradeurl2,
    NameItem3,
    tradeurl3,
) {
    // identity 1st acc
    firstManager.getInventoryContents(753, 6, true, (err, inv) => {
        if (err) {
            // console.log(err);
            // console.log('NR1 Error, in loading our inventory.')
            return;
        }
        const firstOffer = firstManager.createOffer(tradeurl); // tradeurl 2nd accs
        for (var i = 0; i < inv.length; ++i) {
            var itemname = inv[i].market_hash_name.toLowerCase();
            if (itemname.includes(NameItem)) {
                // console.log('Trade Item ' + itemname)
                firstOffer.addMyItem(inv[i]);
                break;
            } else if (i == inv.length - 1) {
                // console.log('NR1 We could not find a item.');
            }
        }
        firstOffer.setMessage(SECURITY_CODE.toString());
        firstOffer.send((err, status) => {
            // posle offer
            if (status == 'pending') {
                firstCommunity.acceptConfirmationForObject(
                    identity,
                    firstOffer.id,
                    (err) => {
                        if (err) {
                            // console.log('NR1 Error accepting Trade.');
                        } else {
                            // console.log('NR1 Trade offered. Counter is at : ' + counter);
                        }
                    },
                );
            }
        });
        const secOff = firstManager.createOffer(tradeurl2); // tradeurl 2nd accs
        for (var i = 0; i < inv.length; ++i) {
            var itemname = inv[i].market_hash_name.toLowerCase();
            if (itemname.includes(NameItem2)) {
                // console.log('Trade Item ' + itemname)
                secOff.addMyItem(inv[i]);
                break;
            } else if (i == inv.length - 1) {
                // console.log('NR1 We could not find a item.');
            }
        }
        secOff.setMessage(SECURITY_CODE.toString());
        secOff.send((err, status) => {
            // posle offer
            if (status == 'pending') {
                firstCommunity.acceptConfirmationForObject(
                    identity,
                    secOff.id,
                    (err) => {
                        if (err) {
                            // console.log('NR1 Error accepting Trade.');
                        } else {
                            // console.log('NR1 Trade offered. Counter is at : ' + counter);
                        }
                    },
                );
            }
        });
        const thirdOff = firstManager.createOffer(tradeurl3); // tradeurl 2nd accs
        for (var i = 0; i < inv.length; ++i) {
            var itemname = inv[i].market_hash_name.toLowerCase();
            if (itemname.includes(NameItem3)) {
                // console.log('Trade Item ' + itemname)
                thirdOff.addMyItem(inv[i]);
                break;
            } else if (i == inv.length - 1) {
                // console.log('NR1 We could not find a item.');
            }
        }
        thirdOff.setMessage(SECURITY_CODE.toString());
        thirdOff.send((err, status) => {
            // posle offer
            if (status == 'pending') {
                firstCommunity.acceptConfirmationForObject(
                    identity,
                    thirdOff.id,
                    (err) => {
                        if (err) {
                            // console.log('NR1 Error accepting Trade.');
                        } else {
                            // console.log('NR1 Trade offered. Counter is at : ' + counter);
                        }
                    },
                );
            }
        });
    });
}
function doOffNR2(trade, identity) {
    const identity_secret = identity;
    // console.log('nr2 Account, has accepted trade. Now sending it back.');
    const newOffer = nr2Manager.createOffer(trade);
    nr2Manager.getInventoryContents(753, 6, true, (err, inv) => {
        if (err) {
            // console.log('2Error getting our inventory.');
        } else {
            newOffer.addMyItem(inv[0]);
            newOffer.setMessage(SECURITY_CODE.toString());
            newOffer.send((err, status) => {
                if (err) {
                    // console.log(err);
                    // console.log('2Error, sending send back trade.');
                } else {
                    nr2Community.acceptConfirmationForObject(
                        identity,
                        newOffer.id,
                        (err) => {
                            if (err) {
                                // console.log('2Could not accept trade.');
                            } else {
                                // console.log('Trade sent back, nr2 account should recieve it in a few seconds.');
                            }
                        },
                    );
                }
            });
        }
    });
}

// Communities
var firstCommunity = new SteamCommunity();
var nr2Community = new SteamCommunity();
var nr3Community = new SteamCommunity();
var nr4Community = new SteamCommunity();

// Security Code
const SECURITY_CODE = Math.floor(Math.random() * 99999 + 1);

let counter = 0;
// Log On Options
const firstLogonOptions = {
    accountName: 'xxxxxxxxxx',
    password: 'xxxx',
    twoFactorCode: SteamTotp.getAuthCode('xxxxxxxxxxx='),
    // trade url : https://steamcommunity.com/tradeoffer/new/?partner=668962&token=5eFGSpfP
    // identity : +Jccccccccccccccccccc
};
const nr2LogonOptions = {
    accountName: 'xxxx',
    password: 'xxx',
    twoFactorCode: SteamTotp.getAuthCode('xxxxxxxxxxx='),
    // trade url : https://steamcommunity.com/tradeoffer/new/?partner=468299384&token=KupUk4HC
    // identity : yrccccccccccccccccccc
};
const nr3LogonOptions = {
    accountName: 'xxxx.net',
    password: 'x',
    twoFactorCode: SteamTotp.getAuthCode('xxx='),
    // trade url : https://steamcommunity.com/tradeoffer/new/?partner=3957865&token=dOR_53xB
    // identity : deccccccccccccccccccc
};
const nr4LogonOptions = {
    accountName: 'x',
    password: 'xx',
    twoFactorCode: SteamTotp.getAuthCode('xx='),
    // trade url : https://steamcommunity.com/tradeoffer/new/?partner=443420692&token=jRQTrSrf
    // identity : ccccccccccccccccccccc
};

// Logging in...
firstClient.logOn(firstLogonOptions);
nr2Client.logOn(nr2LogonOptions);

firstClient.on('loggedOn', () => {
    console.log('Logged In!');
    firstClient.setPersona(SteamUser.EPersonaState.Online);
    firstClient.gamesPlayed([440, 570]); // if you want a custom game you use firstClient.gamesPlayed(["CUSTOM GAME",440,570]);
});

firstClient.on('webSession', (sessionID, cookies) => {
    firstManager.setCookies(cookies, (err) => {
        if (err) {
            console.log(err);
            process.exit(1);
            return;
        }
        bar1.start(10000, 0);
        doOfferNR1(
            'town',
            'https://steamcommunity.com/tradeoffer/new/?partner=468299384&token=KupUk4HC',
            '+xxxxxxxxxxx=',
            'swat',
            'https://steamcommunity.com/tradeoffer/new/?partner=3957865&token=dOR_53xB',
            'street',
            'https://steamcommunity.com/tradeoffer/new/?partner=443420692&token=jRQTrSrf',
        );
        // sleep(5);
        // doOfferNR1('reclaimed', 'https://steamcommunity.com/tradeoffer/new/?partner=3957865&token=dOR_53xB', '+JODCAvLMnGfDpgE5JQ16uOp0G4=');
    });

    firstCommunity.setCookies(cookies);
});

firstManager.on('newOffer', (offer) => {
    if (
        offer.message.toString() == SECURITY_CODE.toString() &&
        offer.itemsToGive.length == 0
    ) {
        // console.log(getTime()+' #' + ++counter);
        bar1.update(++counter);
        offer.accept((err) => {
            doOfferNR1(
                'town',
                'https://steamcommunity.com/tradeoffer/new/?partner=468299384&token=KupUk4HC',
                '+xxxxxxxxxxxxxxxx=',
                'swat',
                'https://steamcommunity.com/tradeoffer/new/?partner=3957865&token=dOR_53xB',
                'street',
                'https://steamcommunity.com/tradeoffer/new/?partner=443420692&token=jRQTrSrf',
            );
        });
    } else {
        console.log('Ignorning trade.');
    }
});

nr2Client.on('loggedOn', () => {
    console.log('Nr2 Logged In!');
    nr2Client.setPersona(SteamUser.EPersonaState.Online);
    nr2Client.gamesPlayed([440, 570]); // If you want a custom game you use firstClient.gamesPlayed(["CUSTOM GAME",440,570]);
});

nr2Client.on('webSession', (sessionID, cookies) => {
    nr2Manager.setCookies(cookies, (err) => {
        if (err) {
        }
    });
    nr2Community.setCookies(cookies);
});

nr3Client.on('loggedOn', () => {
    console.log('Nr3 Logged In!');
    nr3Client.setPersona(SteamUser.EPersonaState.Online);
    nr3Client.gamesPlayed([440, 570]); // If you want a custom game you use firstClient.gamesPlayed(["CUSTOM GAME",440,570]);
});

nr3Client.on('webSession', (sessionID, cookies) => {
    nr3Manager.setCookies(cookies, (err) => {
        if (err) {
        }
    });
    nr3Community.setCookies(cookies);
});
nr4Client.on('loggedOn', () => {
    console.log('Nr4 Logged In!');
    nr4Client.setPersona(SteamUser.EPersonaState.Online);
    nr4Client.gamesPlayed([440, 570]); // If you want a custom game you use firstClient.gamesPlayed(["CUSTOM GAME",440,570]);
});

nr4Client.on('webSession', (sessionID, cookies) => {
    nr4Manager.setCookies(cookies, (err) => {
        if (err) {
        }
    });
    nr4Community.setCookies(cookies);
});
nr2Manager.on('newOffer', (offer) => {
    // console.log(getTime()+' #' + ++counter);
    bar1.update(++counter);

    // console.log('Second Account found an Offer!');
    if (
        offer.message.toString() == SECURITY_CODE.toString() &&
        offer.itemsToGive.length == 0
    ) {
        offer.accept((err) => {
            doOffNR2(
                'https://steamcommunity.com/tradeoffer/new/?partner=668962&token=5eFGSpfP',
                'xxxxxxxx+xxxxxxxxxxxxxxx+g=',
            );
        });
    } else {
        console.log('We found a trade, that has not been made by bot.');
    }
});
nr3Manager.on('newOffer', (offer) => {
    // console.log(getTime()+' #' + ++counter);
    bar1.update(++counter);

    // console.log('third Account found an Offer!');
    if (
        offer.message.toString() == SECURITY_CODE.toString() &&
        offer.itemsToGive.length == 0
    ) {
        offer.accept((err) => {
            doOffNR3(
                'https://steamcommunity.com/tradeoffer/new/?partner=668962&token=5eFGSpfP',
                'cccccccccc=',
            );
        });
    } else {
        console.log('We found a trade, that has not been made by bot.');
    }
});
nr4Manager.on('newOffer', (offer) => {
    // console.log(getTime()+' #' + ++counter);
    bar1.update(++counter);
    // console.log('third Account found an Offer!');
    if (
        offer.message.toString() == SECURITY_CODE.toString() &&
        offer.itemsToGive.length == 0
    ) {
        offer.accept((err) => {
            doOffNR4(
                'https://steamcommunity.com/tradeoffer/new/?partner=668962&token=5eFGSpfP',
                'aaaaaaaaaaadsa',
            );
        });
    } else {
        console.log('We found a trade, that has not been made by bot.');
    }
});
