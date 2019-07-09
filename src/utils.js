const secondFormatter = (seconds) => {
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    const mins = Math.floor((seconds / 60) % 60).toString().padStart(2, '0');
    const hrs = Math.floor((seconds / (60 * 60)) % 24).toString().padStart(2, '0');

    const formattedSeconds = `${hrs !== '00' ? `${hrs}:` : ''}` + `${mins}:${secs}`;

    return formattedSeconds;
};

module.exports = {
    secondFormatter,
};
