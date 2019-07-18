const config = require('nconf');
const { RTMClient } = require('@slack/rtm-api');
const { WebClient } = require('@slack/web-api');

const Sonos = require('./sonos');

// SET UP CONFIG
config.argv().env();
config.file({ file: 'config.json' });
config.defaults({
    "sonosChannels" : ["sonos", "sonos3"],
    "spotifyMarket": "GB",
    "spotifySearchLimit": 5,
    "volumeInterval": 5,
    "volumeMax": 35,
    "playlistNameMax": 30
});

const slackToken = config.get('slackToken');

// CONFIG VALIDATION (perhaps dynamically read variable names for the messages?)

// CONNECT SLACK
const slackRTMClient = new RTMClient(slackToken);
const slackWebClient = new WebClient(slackToken);
slackRTMClient.start().catch(console.error);

// START SLACK LISTENER
new Sonos(slackRTMClient, slackWebClient, config);