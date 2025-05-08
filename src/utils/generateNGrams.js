export default (text, min = 2, max = 4) => {
    text = text.toLowerCase().trim();
    const tokens = [];

    for (let n = min; n <= max && n <= text.length; n++) {
        tokens.push(text.slice(0, n));
    }
    return tokens;
}