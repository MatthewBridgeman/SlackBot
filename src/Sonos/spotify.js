const spotify = require('node-spotify-api');

const {
    spotifySearchLimit,
    spotifyId,
    spotifySecret,
} = require('./config');

let Spotify;

class SpotifyClass {
    constructor() {
        Spotify = new spotify({
            id: spotifyId,
            secret: spotifySecret,
        });
    }

    async searchSong(query)  {
        const songList = [];

        try {
            const { tracks } = await Spotify.search({ type: 'track', query, limit: spotifySearchLimit });

            tracks.items.forEach(songInfo => {
                const {
                    artists,
                    album: {
                        name: album,
                        release_date: releaseDate,
                        images,
                    } = {},
                    name: songName,
                    uri,
                } = songInfo;

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
            console.error('An error occurred searching for a song on spotify:', error);
        }
    };

    async searchAlbum(query)  {
        const albumList = [];

        try {
            const { albums } = await Spotify.search({ type: 'album', query, limit: spotifySearchLimit });

            albums.items.forEach(albumInfo => {
                const {
                    artists,
                    images,
                    name,
                    release_date: releaseDate,
                    total_tracks: totalTracks,
                    uri,
                } = albumInfo;

                const artist = artists && artists.length && artists[0].name;
                const albumImage = images && images.length && images[2] && images[2].url;

                const album = {
                    artist,
                    album: name,
                    albumImage,
                    releaseDate,
                    totalTracks,
                    uri,
                };

                albumList.push(album);
            });

            return albumList;
        } catch (error) {
            console.error('An error occurred searching for an album on spotify:', error);
        }
    };

    async searchPlaylist(query)  {
        const playlistList = [];

        try {
            const { playlists } = await Spotify.search({ type: 'playlist', query, limit: spotifySearchLimit });

            playlists.items.forEach(playlistInfo => {
                const {
                    images,
                    name,
                    tracks: {
                        total: totalTracks,
                    },
                    owner: {
                        display_name: user,
                    },
                    uri,
                } = playlistInfo;

                const playlistImage = images && images.length && images[0].url;

                const playlist = {
                    playlist: name,
                    playlistImage,
                    totalTracks,
                    user,
                    uri,
                };

                playlistList.push(playlist);
            });

            return playlistList;
        } catch (error) {
            console.error('An error occurred searching for a playlist on spotify:', error);
        }
    };

    async getSong(uri)  {
        try {
            const songInfo = await Spotify.request(`https://api.spotify.com/v1/tracks/${uri}`);

            const {
                artists,
                album: {
                    name: album,
                    release_date: releaseDate,
                    images,
                } = {},
                name: songName,
            } = songInfo;

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

            return song;
        } catch (error) {
            console.error('An error occurred searching for a playlist on spotify:', error);
        }
    };
}

module.exports = SpotifyClass
