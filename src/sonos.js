const autoBind = require('auto-bind');
const { Sonos: SonosClient } = require('sonos');

const { secondFormatter } = require('./utils');
const Spotify = require('./spotify');

let Slack;
let Sonos;

class SonosClass {
    constructor(slackClient, config) {
        Slack = slackClient;

        // CONNECT SONOS
        const sonosIp = config.get('sonosIp');
        Sonos = new SonosClient(sonosIp);

        // MESSAGE LISTENER
        Slack.on('message', (event) => this.processInput(event));

        autoBind(this);
    }

    // PROCESS SLACK COMMANDS
    processInput(event) {
        const message = event.text;
        const channel = event.channel;

        if (message.charAt(0) === '!') {
            const command = message.substring(1).split(' ')[0].toLowerCase();

            switch (command) {
                case 'current':
                    this._current(channel);
                    break;

                case 'play':
                    this._play(channel);
                    break;

                case 'resume':
                    this._resume(channel);
                    break;

                case 'stop':
                    this._stop(channel);
                    break;

                case 'pause':
                    this._pause(channel);
                    break;

                case 'next':
                    this._next(channel);
                    break;

                case 'previous':
                case 'prev':
                case 'back':
                    this._prev(channel);
                    break;

                case 'search':
                    this._search(channel);
                    break;

                case 'add':
                    this._add(channel);
                    break;

                default:
                    this._slackMessage(`I'm sorry, but ${command} is not a command`, channel);
                    break;
            }
        }

        console.log(event);
    }

    // HELPER FUNCTIONS
    async _slackMessage(message, channel) {
        try {
            await Slack.sendMessage(message, channel);
        } catch (error) {
            console.error('An error occurred sending a message:', error);
        }
    }

    async _currentSong() {
        try {
            const { artist, title, duration, position } = await Sonos.currentTrack();
            const durationFormatted = secondFormatter(duration);
            const positionFormatted = secondFormatter(position);

           return { artist, title, position: positionFormatted, duration: durationFormatted };
        } catch (error) {
            console.error('An error occurred getting the current song:', error);
        }
    }

    // COMMAND FUNCTIONS
    async _current(channel) {
        try {
            const { artist, title, position, duration } = await this._currentSong();

            console.log({ artist, title, duration });
            this._slackMessage(`Current song playing: *${artist}* - *${title}* (${position} / ${duration})`, channel);
        } catch (error) {
            console.error('An error occurred getting the current song:', error);
        }
    }

    async _play(channel) {
        try {
            await Sonos.selectQueue();
            const success = await Sonos.play();

            if (success) {
                const { artist, title, duration } = await this._currentSong();

                this._slackMessage(`Started playing: *${artist}* - *${title}* (${duration})`, channel);
            }
        } catch (error) {
            console.error('An error occurred playing the song:', error);
        }
    }

    async _resume(channel) {
        try {
            const success = await Sonos.play();

            if (success) {
                const { artist, title, position, duration } = await this._currentSong();

                this._slackMessage(`Resumed playing: *${artist}* - *${title}* (${position} / ${duration})`, channel);
            }
        } catch (error) {
            console.error('An error occurred resuming the song:', error);
        }
    }

    async _stop(channel) {
        try {
            const success = await Sonos.stop();

            if (success) {
                const { artist, title, position, duration } = await this._currentSong();

                this._slackMessage(`Stopped playing: *${artist}* - *${title}*`, channel);
            }
        } catch (error) {
            console.error('An error occurred stopping the song:', error);
        }
    }

    async _pause(channel) {
        try {
            const success = await Sonos.pause();

            if (success) {
                const { artist, title, position, duration } = await this._currentSong();

                this._slackMessage(`Paused playing: *${artist}* - *${title}* (${position} / ${duration})`, channel);
            }
        } catch (error) {
            console.error('An error occurred pausing the song:', error);
        }
    }

    async _next(channel) {
        try {
            const success = await Sonos.next();

            if (success) {
                const { artist, title, duration } = await this._currentSong();

                this._slackMessage(`Now playing next song in playlist: *${artist}* - *${title}* (${duration})`, channel);
            }
        } catch (error) {
            console.error('An error occurred playing the next song in playlist:', error);
        }
    }

    async _prev(channel) {
        try {
            const success = await Sonos.previous();

            if (success) {
                const { artist, title, duration } = await this._currentSong();

                this._slackMessage(`Now playing previous song in playlist: *${artist}* - *${title}* (${duration})`, channel);
            }
        } catch (error) {
            console.error('An error occurred playing the previous song in playlist:', error);
        }
    }

    async _search(channel) {
        try {
            const reply = await Spotify.search();

            this._slackMessage(reply, channel);
        } catch (error) {
            console.error('An error occurred searching for a song:', error);
        }
    }

    async _add(channel) {
        try {
            const reply = await Spotify.search();

            this._slackMessage(`Add: ${reply}`, channel);
        } catch (error) {
            console.error('An error occurred adding a song to the playlist:', error);
        }
    }
}

module.exports = SonosClass;
