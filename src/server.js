const express = require('express');
const bodyParser = require('body-parser');
const { RTMClient } = require('@slack/rtm-api');
const { WebClient } = require('@slack/web-api');

const config = require('./config');
const Sonos = require('./Sonos/sonos');

// CONNECT TO SLACK
const slackToken = config.slackToken;

const slackRTMClient = new RTMClient(slackToken);
const slackWebClient = new WebClient(slackToken);
slackRTMClient.start().catch(console.error);

// START SONOS LISTENER
const sonosModule = new Sonos(slackRTMClient, slackWebClient);

// SET UP SERVER TO RECEIVE INTERACTIVE SLACK EVENTS
const server = express();
const router = express.Router();
const serverPort = config.serverPort;

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

router.post(config.serverUrl, (req, res) => {
    const body = JSON.parse(req.body.payload);
    const actionInfo = body.actions[0].value.split('|');
    const moduleType = actionInfo.shift();
    const channel = body.channel.id;
    const user = body.user.id;
    const timestamp = body.message.ts;

    if (moduleType.toLowerCase() === 'sonos') {
        sonosModule.processPostRequest(actionInfo, channel, user, timestamp);
    }

    res.send('ok');
});
server.use(router);

server.listen(serverPort, () => {
    console.log(`Slack App is now running on port ${serverPort}`);
}).on('error', ({ code }) => {
    if (code === 'EADDRINUSE') {
        console.error(`⚠ Error: port ${serverPort} in use! Slack App shutting down...`);
        process.exit(1);
    }
});