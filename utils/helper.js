
const { ethers } = require("ethers");

exports.validateAddress = (address) => {
    try {
        return ethers.isAddress(address);
    } catch (error) {
        return false;
    }
}