const secondFormatter = (seconds) => {
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    const mins = Math.floor((seconds / 60) % 60).toString().padStart(2, '0');
    const hrs = Math.floor((seconds / (60 * 60)) % 24).toString().padStart(2, '0');

    const formattedSeconds = `${hrs !== '00' ? `${hrs}:` : ''}` + `${mins}:${secs}`;

    return formattedSeconds;
};

const padLeft = (str, len) => (
    len > str.length
        ? (new Array(len - str.length + 1)).join(' ') + str
        : str
);

const padRight = (str, len) => (
    len > str.length
        ? str + (new Array(len - str.length + 1)).join(' ')
        : str
);

module.exports = {
    secondFormatter,
    padLeft,
    padRight,
};
