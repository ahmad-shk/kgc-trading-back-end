require("dotenv").config();
const Web3 = require("web3");
const numeral = require("numeral");
numeral.locale("en");
const { logger } = require("../logger");
// const { eventEmitter } = require("../configLoader");
// const { CONSTANTS } = require("../constants");

const contractABI = require("../contractABI/TokenContractABI.json");
const { RPC_URL, TOKEN_CONTRACT_ADDRESS: contractAddress } = require("../config");

const  smart_contract = {
    isAtive: true,
    contractName: 'Token',
    contractAddress:contractAddress, 
    environmentType: 'development',
    rpc_url: RPC_URL||'https://sepolia.infura.io/v3/',
    contractABI: contractABI,
}

// eventEmitter.on("configLoaded", () => {
//     if (CONSTANTS.CONSTANTS.length > 0) {
//         smart_contract = CONSTANTS.CONSTANTS.find(contract => contract.contractName ===smart_contract.contractName);
//         console.log(smart_contract.contractName, smart_contract.contractAddress);
//     }
//     // Start your server or perform further initialization here
// });


logger.log({
    "level": "info",
    "RPC_URL": smart_contract.rpc_url,
    "message": "RPC_URL"
})

// Utility to initialize Web3 and validate inputs
const initializeWeb3 = () => new Web3(smart_contract.rpc_url);

const validateAddress = (address) => {
    const web3 = initializeWeb3();
    return web3.utils.isAddress(address);
};

const getContractInstance = (web3) => {
    if (!validateAddress(smart_contract.contractAddress) || !smart_contract.contractABI) {
        throw new Error("Invalid token address or ABI JSON");
    }
    return new web3.eth.Contract(smart_contract.contractABI, smart_contract.contractAddress);
};

exports.validateAddress = validateAddress;
// Controller methods
exports.TokenbalanceOf = async (req, res) => {
    const web3 = initializeWeb3();
    const { walletAddress } = req.params;

    if (!validateAddress(walletAddress)) {
        return res.json({ error: true, message: "Invalid wallet address" });
    }

    try {
        const contract = getContractInstance(web3);
        const balance = await contract.methods.balanceOf(walletAddress).call();
        const data = numeral(web3.utils.fromWei(balance.toString())).format('0.0000');
        res.json({ error: false, data });
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
};

exports.GetName = async (req, res) => {
    try {
        const web3 = initializeWeb3();
        const contract = getContractInstance(web3);
        const name = await contract.methods.name().call();
        res.json({ error: false, name });
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
};

exports.GetTotalSupply = async (req, res) => {
    try {
        const web3 = initializeWeb3();
        const contract = getContractInstance(web3);
        const totalSupply = await contract.methods.totalSupply().call();
        res.json({ error: false, totalSupply: numeral(totalSupply).format("0.00a") });
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
};

exports.GetDecimals = async (req, res) => {
    try {
        const web3 = initializeWeb3();
        const contract = getContractInstance(web3);
        const decimals = await contract.methods.decimals().call();
        res.json({ error: false, decimals });
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
};

exports.GetSymbol = async (req, res) => {
    try {
        const web3 = initializeWeb3();
        const contract = getContractInstance(web3);
        const symbol = await contract.methods.symbol().call();
        res.json({ error: false, symbol });
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
};

exports.GetAllowance = async (req, res) => {
    const { owner, spender } = req.params;

    if (!validateAddress(owner) || !validateAddress(spender)) {
        return res.json({ error: true, message: "Invalid owner or spender address" });
    }

    try {
        const web3 = initializeWeb3();
        const contract = getContractInstance(web3);
        const allowance = await contract.methods.allowance(owner, spender).call();
        res.json({ error: false, allowance: numeral(allowance).format("0.00a") });
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
};

// require("dotenv").config();
// const Web3 = require("web3");
// const numeral = require('numeral');
// numeral.locale('en');
// const contractABI =require('../contractABI/TokenContractABI.json')

// const RPC_URL = process.env.RPC_URL
// const contractAddress =process.env.TOKEN_CONTRACT_ADDRESS
// // TokenbalanceOf controller method: balanceOf
// exports.TokenbalanceOf = async (request, response) => {
//     // const _web3 = new Web3.providers.HttpProvider(RPC_URL)
//     const web3 = new Web3(RPC_URL);
//     const { walletAddress } = request.params;
//     console.log(walletAddress, "addresswallet");
//     // check if wallet address is valid
//     if (!web3.utils.isAddress(walletAddress)) {
//         return response.json({ error: true, message: "Invalid wallet address" });
//     }
//     // check if token address is valid
//     if (!web3.utils.isAddress(contractAddress)) {
//         return response.json({ error: true, message: "Invalid token address" });
//     }
//     // check if contract ABI is valid
//     if (!contractABI) {
//         return response.json({ error: true, message: "Invalid contract ABI" });
//     }
//     try {
//         const contract = new web3.eth.Contract(contractABI, contractAddress);
//         const balance = await contract.methods.balanceOf(walletAddress).call();
//         console.log("balancecheck", balance);
//         response.json({ error: false, balance: numeral(balance).format("0.00a") });
//     }
//     catch (error) {
//         response.json({ error: true, message: error.message });
//     }
// }
// // GetName controller method: name
// exports.GetName = async (request, response) => {
//     const web3 = new Web3(RPC_URL);    
//     if (!web3.utils.isAddress(contractAddress) || !contractABI) {
//         return response.json({ error: true, message: "Invalid token address or ABI json" });
//     }
    
//     try {
//         const contract = new web3.eth.Contract(contractABI, contractAddress);
//         const name = await contract.methods.name().call();
//         console.log("name", name);
//         response.json({ error: false, name: name });
//     }
//     catch (error) {
//         response.json({ error: true, message: error.message });
//     }
// }
// // GetTotalSupply controller method: totalSupply
// exports.GetTotalSupply = async (request, response) => {
//     const web3 = new Web3(RPC_URL);
//     if (!web3.utils.isAddress(contractAddress) || !contractABI) {
//         return response.json({ error: true, message: "Invalid token address or ABI json" });
//     }
//     try {
//         const contract = new web3.eth.Contract(contractABI, contractAddress);
//         const totalSupply = await contract.methods.totalSupply().call();
//         console.log("totalSupply", numeral(totalSupply).format('0.00a'), typeof totalSupply);
//         response.json({ error: false, totalSupply: numeral(totalSupply).format('0.00a') });
//     }
//     catch (error) {
//         response.json({ error: true, message: error.message });
//     }
// }
// // GetDecimals controller method: decimals
// exports.GetDecimals = async (request, response) => {
//     const web3 = new Web3(RPC_URL);
//     if (!web3.utils.isAddress(contractAddress) || !contractABI) {
//         return response.json({ error: true, message: "Invalid token address or ABI json" });
//     }
//     try {
//         const contract = new web3.eth.Contract(contractABI, contractAddress);
//         const decimals = await contract.methods.decimals().call();
//         console.log("decimals", decimals);
//         response.json({ error: false, decimals: decimals });
//     }
//     catch (error) {
//         response.json({ error: true, message: error.message });
//     }
// }
// // GetSymbol controller method: symbol
// exports.GetSymbol = async (request, response) => {
//     const web3 = new Web3(RPC_URL);
//     if (!web3.utils.isAddress(contractAddress) || !contractABI) {
//         return response.json({ error: true, message: "Invalid token address or ABI json" });
//     }
//     try {
//         const contract = new web3.eth.Contract(contractABI, contractAddress);
//         const symbol = await contract.methods.symbol().call();
//         console.log("symbol", symbol);
//         response.json({ error: false, symbol: symbol });
//     }
//     catch (error) {
//         response.json({ error: true, message: error.message });
//     }
// }
// // GetAllowance controller method: allowance
// exports.GetAllowance = async (request, response) => {
//     const web3 = new Web3(RPC_URL);
//     const { owner, spender } = request.params;
//     if (!web3.utils.isAddress(owner) || !web3.utils.isAddress(spender) || !web3.utils.isAddress(contractAddress) || !contractABI) {
//         return response.json({ error: true, message: "Invalid owner, spender, token address or ABI json" });
//     }
//     try {
//         const contract = new web3.eth.Contract(contractABI, contractAddress);
//         const allowance = await contract.methods.allowance(owner, spender).call();
//         console.log("allowance", allowance);
//         response.json({ error: false, allowance: numeral(allowance).format('0.00a') });
//     }
//     catch (error) {
//         response.json({ error: true, message: error.message });
//     }
// }