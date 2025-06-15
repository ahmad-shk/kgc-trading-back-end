
const { ethers } = require("ethers");

exports.validateAddress = (address) => {
    try {
        return ethers.isAddress(address);
    } catch (error) {
        return false;
    }
}

exports.generateKey = (length = 40) => {
    const hexChars = '0123456789abcdef';
    let key = '0x';
    for (let i = 0; i < length; i++) {
        const char = hexChars[Math.floor(Math.random() * hexChars.length)];
        // Randomly make the character uppercase
        key += Math.random() > 0.5 ? char.toUpperCase() : char;
    }

    return key;
}