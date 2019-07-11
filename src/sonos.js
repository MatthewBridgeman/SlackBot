const autoBind = require('auto-bind');
const _ = require('lodash');
const { Sonos: SonosClient, SpotifyRegion } = require('sonos');

const { secondFormatter, padRight } = require('./utils');
const spotify = require('./spotify');

let Slack;
let Sonos;
let Spotify;

const playmodes = ['NORMAL', 'REPEAT_ONE', 'REPEAT_ALL', 'SHUFFLE', 'SHUFFLE_NOREPEAT', 'SHUFFLE_REPEAT_ONE'];

class SonosClass {
    constructor(slackClient, config) {
        Slack = slackClient;

        // CONNECT SONOS
        const sonosIp = config.get('sonosIp');
        Sonos = new SonosClient(sonosIp);

        const spotifyMarket = config.get('spotifyMarket');

        if (spotifyMarket !== 'US') {
            Sonos.setSpotifyRegion(SpotifyRegion.EU);
        }

        // INITIALIZE SPOTIFY
        Spotify = new spotify(config,);

        // MESSAGE LISTENER
        Slack.on('message', (event) => this.processInput(event));

        autoBind(this);
    }

    // PROCESS SLACK COMMANDS
    processInput(event) {
        const message = event.text;
        const channel = event.channel;

        if (message && message.charAt(0) === '!') {
            const splitMessage = message.substring(1).split(' ');
            const command = splitMessage.shift().toLowerCase();
            const input = splitMessage.join(' ');

            switch (command) {
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

                case 'current':
                    this._current(channel);
                    break;

                case 'playlist':
                case 'list':
                case 'songs':
                    this._playlist(channel);
                    break;

                case 'playmode':
                    this._playmode(input, channel);
                    break;

                case 'search':
                    this._search(input, channel);
                    break;

                case 'add':
                    this._add(input, channel);
                    break;

                case 'remove':
                case 'rem':
                case 'del':
                    this._remove(input, channel);
                    break;

                case 'help':
                    this._help(channel);
                    break;

                default:
                    this._slackMessage(`I'm sorry, but ${command} is not a command`, channel);
                    break;
            }
        }
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
            const { artist, title, duration, position, queuePosition } = await Sonos.currentTrack();
            const durationFormatted = secondFormatter(duration);
            const positionFormatted = secondFormatter(position);

           return { artist, title, position: positionFormatted, duration: durationFormatted, playlistPosition: queuePosition };
        } catch (error) {
            console.error('An error occurred getting the current song info:', error);
        }
    }

    // COMMAND FUNCTIONS
    async _help(channel) {
        try {
            const message = [
                'Current commands!',
                ' ===  ===  ===  ===  ===  ===  ===  ===  ===  ===  === ',
                '`!play` : Play song',
                '`!stop` : Stop song',
                '`!pause` : Pause song',
                '`!resume` : Resume song',
                '`!next` : Play the next song',
                '`!previous` : Play the previous song',
                '`!current` : Display the current song',
                '`!playlist` : Display the entire playlist',
                '`!playmode` : Display the current playmode',
                '`!playmode <playmode>` : Change the playmode',
                '`!search <text>` : Search Spotify for a song',
                '`!add <text>` : Add the first returned song result from Spotify to the playlist',
                '`!remove <playlist position>` : Remove a song at the position from the playlist',
                ' ===  ===  ===  ===  MatthewBridgeman  ===  ===  ===  === ',
            ].join('\n');

            this._slackMessage(message, channel);
        } catch (error) {
            this._slackMessage(`An error occurred trying to display the help list! :(`, channel);
            console.error('An error occurred displaying the help list:', error);
        }
    }

    async _current(channel) {
        try {
            const { artist, title, position, duration } = await this._currentSong();

            console.log({ artist, title, duration });
            this._slackMessage(`:notes: Current song playing: *${artist}* - *${title}* (${position} / ${duration}) :notes:`, channel);
        } catch (error) {
            this._slackMessage(`An error occurred trying to get the current song! :(`, channel);
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
            this._slackMessage(`An error occurred trying to play the song! :(`, channel);
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
            this._slackMessage(`An error occurred trying to resume the song! :(`, channel);
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
            this._slackMessage(`An error occurred trying to stop the song! :(`, channel);
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
            this._slackMessage(`An error occurred trying to pause the song! :(`, channel);
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
            this._slackMessage(`An error occurred trying to play the next song! :(`, channel);
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
            this._slackMessage(`An error occurred trying to play the previous song! :(`, channel);
            console.error('An error occurred playing the previous song in playlist:', error);
        }
    }

    async _search(input, channel) {
        try {
            if (!input) {
                return this._slackMessage('You must specify a song to search for!\n!search <song name>', channel);
            }

            const songList = await Spotify.search(input);

            if (!songList.length) {
                return this._slackMessage('No songs found! :(', channel);
            }

            const songs = songList.map(songInfo => {
                const {
                    artist,
                    song,
                    album,
                    releaseDate,
                } = songInfo;

                return `${padRight(`${artist} - ${song} (${album})`, 80)} Released: ${releaseDate}`;
            });

            const message = `\`\`\`${songs.join('\n')}\`\`\``;

            this._slackMessage(message, channel);
        } catch (error) {
            this._slackMessage(`An error occurred searching for the song! :(`, channel);
            console.error('An error occurred searching for a song:', error);
        }
    }

    async _add(input, channel) {
        try {
            if (!input) {
                return this._slackMessage('You must specify a song to search for!\n!add <song name>', channel);
            }

            const songList = await Spotify.search(input);

            if (!songList.length) {
                this._slackMessage('No songs found! :(', channel);
            }

            const {
                artist,
                song,
                album,
                albumImage,
                uri,
            } = songList[0];

            const result = await Sonos.queue(uri);
            const {
                FirstTrackNumberEnqueued: position,
                NewQueueLength: playlistLength,
            } = result;

            const message = [
                albumImage,
                `Sure thing! *${artist}* - *${song} (${album})* has been added to the queue!`,
                `Position ${position} out of ${playlistLength} in playlist`,
            ].join('\n');

            this._slackMessage(message, channel);
        } catch (error) {
            this._slackMessage(`An error occurred trying to add the song to the playlist! :(`, channel);
            console.error('An error occurred adding a song to the playlist:', error);
        }
    }

    async _remove(input, channel) {
        try {
            if (!input) {
                return this._slackMessage('You must specify a playlist position to remove!\n!remove <position>', channel);
            }

            const trackNumber = input.split(' ')[0];

            if (!Number(trackNumber) || isNaN(trackNumber)) {
                return this._slackMessage(`${trackNumber} is not a number!`, channel);
            }

            const { items: playlist } = await Sonos.getQueue();
            const song = playlist[trackNumber - 1];

            if (!song) {
                return this._slackMessage(`There is no song at position ${trackNumber}`, channel);
            }

            const { title, artist, album } = song;

            await Sonos.removeTracksFromQueue(trackNumber);

            this._slackMessage(`*${artist}* - *${title} (${album})* has been removed from the playlist`, channel);
        } catch (error) {
            this._slackMessage(`An error occurred trying to remove the song from the playlist! :(`, channel);
            console.error('An error occurred removing a song from the playlist:', error);
        }
    }

    async _playlist(channel) {
        try {
            const playlist = await Sonos.getQueue();

            const songs = playlist.items.map((song, index) => {
                const { title, artist, album } = song;
                index = index + 1;

                return `${index}. ${artist} - ${title} (${album})`;
            });

            const { artist, title, duration, position, playlistPosition }  = await this._currentSong();

            const message = [
                `:notes: Currently playing #${playlistPosition}: *${artist}* - *${title}* (${position} / ${duration}) :notes:`,
                `\`\`\`${songs.join('\n')}\`\`\``,
            ].join('\n');

            this._slackMessage(message, channel);
        } catch (error) {
            this._slackMessage(`An error occurred trying to get the playlist! :(`, channel);
            console.error('An error occurred getting the playlist:', error);
        }
    }

    async _playmode(input, channel) {
        try {
            const currentPlaymode = await Sonos.getPlayMode('shuffle');

            if (!input) {
                return this._slackMessage(`Current playmode is set to: *${currentPlaymode.toLowerCase()}*`, channel);
            }

            const playmode = _.snakeCase(input).toUpperCase();

            if (currentPlaymode === playmode) {
                return this._slackMessage(`The playmode is already set to that!`, channel);
            }

            if (!playmodes.includes(playmode)) {
                const playmodesFormatted = playmodes.map(mode => `*${_.lowerCase(mode)}*`).join(', ');

                return this._slackMessage(`That playmode is not recognised, the available playmodes are: ${playmodesFormatted}`, channel);
            }

            await Sonos.setPlayMode(playmode);

            this._slackMessage(`Playmode is now set to: ${input}`, channel);
        } catch (error) {
            this._slackMessage(`An error occurred trying to get/change the playmode! :(`, channel);
            console.error('An error occurred getting/changing the playmode:', error);
        }
    }
}

module.exports = SonosClass;
