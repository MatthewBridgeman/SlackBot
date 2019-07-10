const autoBind = require('auto-bind');
const { Sonos: SonosClient, SpotifyRegion } = require('sonos');

const { secondFormatter, padRight } = require('./utils');
const spotify = require('./spotify');

let Slack;
let Sonos;
let Spotify;

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

                case 'playlist':
                    this._playlist(channel);
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
            const { artist, title, duration, position } = await Sonos.currentTrack();
            const durationFormatted = secondFormatter(duration);
            const positionFormatted = secondFormatter(position);

           return { artist, title, position: positionFormatted, duration: durationFormatted };
        } catch (error) {
            console.error('An error occurred getting the current song info:', error);
        }
    }

    // COMMAND FUNCTIONS
    async _current(channel) {
        try {
            const { artist, title, position, duration } = await this._currentSong();

            console.log({ artist, title, duration });
            this._slackMessage(`Current song playing: *${artist}* - *${title}* (${position} / ${duration})`, channel);
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
                songName,
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
                `Sure thing! *${artist}* - *${songName} (${album})* has been added to the queue!`,
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

            this._slackMessage(`\`\`\`${songs.join('\n')}\`\`\``, channel);
        } catch (error) {
            this._slackMessage(`An error occurred trying to get the playlist! :(`, channel);
            console.error('An error occurred getting the playlist:', error);
        }
    }
}

module.exports = SonosClass;
