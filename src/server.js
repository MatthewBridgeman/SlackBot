const config = require('nconf');
const { RTMClient } = require('@slack/rtm-api');
const { Sonos } = require('sonos');

const { secondFormatter } = require('./utils');

// SET UP CONFIG
config.argv().env();
config.file({ file: 'config.json' });
config.defaults({
    'adminChannel': 'music-admin',
    'standardChannel': 'music',
});

const slackToken = config.get('slackToken');
const sonosIp = config.get('sonosIp');

// CONFIG VALIDATION (perhaps dynamically read variable names for the messages?)
switch (undefined) {
    case slackToken:
        console.error('A slack token must be provided for this bot to work');
        break;

    case sonosIp:
        console.error('A sonos IP must be provided for this bot to work');
        break;
}

// CONNECT SONOS
const sonos = new Sonos(sonosIp);

// CONNECT SLACK
const slack = new RTMClient(slackToken);
slack.start().catch(console.error);

// (Perhaps move this to slack.js, and pass the slack and sonos objects in?)
// LISTEN FOR SLACK COMMANDS
slack.on('message', async (event) => {
    const message = event.text;
    const channel = event.channel;

    if (message.charAt(0) === '!') {
        const command = message.substring(1).split(' ')[0].toLowerCase();

        switch (command) {
            case 'current':
                _current(channel);
                break;

            case 'play':
                _play(channel);
                break;

            case 'resume':
                _resume(channel);
                break;

            case 'stop':
                _stop(channel);
                break;

            case 'pause':
                _pause(channel);
                break;

            case 'next':
                _next(channel);
                break;

            case 'previous':
            case 'prev':
            case 'back':
                _prev(channel);
                break;

            default:
                await _slackMessage(`I'm sorry, but ${command} is not a command`, channel);
                break;
        }
    }

    console.log(event);
})

// HELPER FUNCTIONS
const _slackMessage = async (message, channel) => {
    try {
        await slack.sendMessage(message, channel);
    } catch (error) {
        console.error('An error occurred sending a message:', error);
    }
}

const _currentSong = async () => {
    try {
        const { artist, title, duration, position } = await sonos.currentTrack();
        const durationFormatted = secondFormatter(duration);
        const positionFormatted = secondFormatter(position);

       return { artist, title, position: positionFormatted, duration: durationFormatted };
    } catch (error) {
        console.error('An error occurred getting the current song:', error);
    }
}

// COMMAND FUNCTIONS
const _current = async (channel) => {
    try {
        const { artist, title, position, duration } = _currentSong();

        console.log({ artist, title, duration });
        _slackMessage(`Current song playing: *${artist}* - *${title}* (${position} / ${duration})`, channel);
    } catch (error) {
        console.error('An error occurred getting the current song:', error);
    }
}

const _play = async (channel) => {
    try {
        await sonos.selectQueue();
        const success = await sonos.play();

        if (success) {
            const { artist, title, duration } = _currentSong();

            _slackMessage(`Started playing: *${artist}* - *${title}* (${duration})`, channel);
        }
    } catch (error) {
        console.error('An error occurred playing the song:', error);
    }
}

const _resume = async (channel) => {
    try {
        const success = await sonos.play();

        if (success) {
            const { artist, title, position, duration } = _currentSong();

            _slackMessage(`Resumed playing: *${artist}* - *${title}* (${position} / ${duration})`, channel);
        }
    } catch (error) {
        console.error('An error occurred resuming the song:', error);
    }
}

const _stop = async (channel) => {
    try {
        const success = await sonos.stop();

        if (success) {
            const { artist, title, position, duration } = _currentSong();

            _slackMessage(`Stopped playing: *${artist}* - *${title}*`, channel);
        }
    } catch (error) {
        console.error('An error occurred stopping the song:', error);
    }
}

const _pause = async (channel) => {
    try {
        const success = await sonos.pause();

        if (success) {
            const { artist, title, position, duration } = _currentSong();

            _slackMessage(`Paused playing: *${artist}* - *${title}* (${position} / ${duration})`, channel);
        }
    } catch (error) {
        console.error('An error occurred pausing the song:', error);
    }
}

const _next = async (channel) => {
    try {
        const success = await sonos.next();

        if (success) {
            const { artist, title, duration } = _currentSong();

            _slackMessage(`Now playing next song in playlist: *${artist}* - *${title}* (${duration})`, channel);
        }
    } catch (error) {
        console.error('An error occurred playing the next song in playlist:', error);
    }
}

const _prev = async (channel) => {
    try {
        const success = await sonos.previous();

        if (success) {
            const { artist, title, duration } = _currentSong();

            _slackMessage(`Now playing previous song in playlist: *${artist}* - *${title}* (${duration})`, channel);
        }
    } catch (error) {
        console.error('An error occurred playing the previous song in playlist:', error);
    }
}
