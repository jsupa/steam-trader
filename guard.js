const SteamTotp = require('steam-totp');
const settings = require('./settings.json');

settings.users.forEach((userSettings) => {
    const guard = SteamTotp.getAuthCode(userSettings.shared_secret);
    console.log(`${userSettings.username} - ${guard}`);
});
