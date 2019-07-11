const spotify = require('node-spotify-api');

let Spotify;

let searchLimit;

class SpotifyClass {
    constructor(config) {
        searchLimit = config.get('spotifySearchLimit');

        Spotify = new spotify({
            id: config.get('spotifyId'),
            secret: config.get('spotifySecret'),
        });
    }

    async search(query)  {
        const songList = [];

        try {
            const { tracks } = await Spotify.search({ type: 'track', query, limit: searchLimit });

            tracks.items.forEach(track => {
                const {
                    artists,
                    album: {
                        name: album,
                        release_date: releaseDate,
                        images,
                    } = {},
                    name: songName,
                    uri,
                } = track;

                const artistName = artists && artists.length && artists[0].name;
                const albumImage = images && images.length && images[2] && images[2].url;

                const song = {
                    artist: artistName,
                    song: songName,
                    album,
                    albumImage,
                    releaseDate,
                    uri,
                };

                songList.push(song);
            });

            return songList;
        } catch (error) {
            console.error('An error occurred searching a song on spotify:', error);
        }
    };
}

module.exports = SpotifyClass
