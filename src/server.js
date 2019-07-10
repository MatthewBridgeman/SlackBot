const config = require('nconf');
const { RTMClient } = require('@slack/rtm-api');

const Sonos = require('./sonos');

// SET UP CONFIG
config.argv().env();
config.file({ file: 'config.json' });
config.defaults({
    'adminChannel': 'music-admin',
    'standardChannel': 'music',
    'spotifyMarket': 'US',
    "spotifySearchLimit": 5
});

const slackToken = config.get('slackToken');

// CONFIG VALIDATION (perhaps dynamically read variable names for the messages?)

// CONNECT SLACK
const slackClient = new RTMClient(slackToken);
slackClient.start().catch(console.error);

// START SLACK LISTENER
new Sonos(slackClient, config);