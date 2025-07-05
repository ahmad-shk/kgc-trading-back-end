require("dotenv").config();
const Web3 = require("web3");
const numeral = require("numeral");
numeral.locale("en");
const { logger } = require("../logger");
// const { eventEmitter } = require("../configLoader");
// const { CONSTANTS } = require("../constants");

const contractABI = require("../contractABI/TokenContractABI.json");
const { RPC_URL, TOKEN_CONTRACT_ADDRESS: contractAddress, superAdminWalletPrivateKey } = require("../config");

const smart_contract = {
    isAtive: true,
    contractName: 'Token',
    contractAddress: contractAddress,
    environmentType: 'development',
    rpc_url: RPC_URL || 'https://sepolia.infura.io/v3/',
    contractABI: contractABI,
    chainId: 97
}

// eventEmitter.on("configLoaded", () => {
//     if (CONSTANTS.CONSTANTS.length > 0) {
//         smart_contract = CONSTANTS.CONSTANTS.find(contract => contract.contractName ===smart_contract.contractName);
//         console.log(smart_contract.contractName, smart_contract.contractAddress);
//     }
//     // Start your server or perform further initialization here
// });


logger.info(smart_contract.rpc_url)

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


// Validate transaction hash
const validateTransactionHash = (hash) => {
    if (typeof hash !== 'string') return false;
    hash = hash.trim();
    const web3 = initializeWeb3();
    return web3.utils.isHexStrict(hash) && hash.length === 66;
};

const toTokenUnits = (amount, decimals, web3) => {
    if (!web3) {
        throw new Error("web3 instance is required");
    }

    if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error("Invalid token amount");
    }

    // Convert amount to smallest unit (as a string, avoiding float issues)
    const multiplier = web3.utils.toBN(10).pow(web3.utils.toBN(decimals));

    // Convert amount to string, handle decimals manually
    const [whole, fraction = ""] = amount.toString().split(".");
    const paddedFraction = (fraction + "0".repeat(decimals)).slice(0, decimals);

    const wholeBN = web3.utils.toBN(whole).mul(multiplier);
    const fractionBN = web3.utils.toBN(paddedFraction);

    return wholeBN.add(fractionBN);

};
const fromTokenUnits = (amountInSmallestUnit, decimals, web3) => {
    if (!web3) {
        throw new Error("web3 instance is required");
    }

    const divisor = web3.utils.toBN(10).pow(web3.utils.toBN(decimals));
    const humanReadable = web3.utils.toBN(amountInSmallestUnit).div(divisor);
    return humanReadable.toString();
};

const fundTransfer = async (walletAddress, amount) => {
    logger.log("walletAddress", walletAddress, "amount", amount);
    const web3 = initializeWeb3();

    // Validate input
    if (!validateAddress(walletAddress)) {
        throw new Error("Invalid wallet address");
        }

    // Prepare sender account
    const senderAccount = web3.eth.accounts.privateKeyToAccount(superAdminWalletPrivateKey);
    web3.eth.accounts.wallet.add(senderAccount);

    try {
        const contract = getContractInstance(web3);

        // Get token decimals
        const decimals = await contract.methods.decimals().call();
        // const decimals = 6; 
        const amountInSmallestUnit = toTokenUnits(amount, decimals, web3);
        logger.log("Amount in smallest unit:", amountInSmallestUnit.toString());
        const humanReadableAmount = fromTokenUnits(amountInSmallestUnit, decimals, web3);
        logger.log("Human readable amount:", humanReadableAmount);
        // Build transaction
        const data = contract.methods.transfer(walletAddress, amountInSmallestUnit.toString()).encodeABI();
        const nonce = await web3.eth.getTransactionCount(senderAccount.address, 'latest');
        const gasPrice = await web3.eth.getGasPrice();

        const tx = {
            from: senderAccount.address,
            to: smart_contract.contractAddress,
            data: data,
            gas: 100000, // Estimate or adjust as needed
            gasPrice: gasPrice,
            nonce: nonce,
            chainId: smart_contract.chainId, // Optional if using RPC that implies network
        };

        logger.log("Transaction details:", tx);

        // Sign and send
        const signedTx = await web3.eth.accounts.signTransaction(tx, superAdminWalletPrivateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        logger.log("Transaction successful with hash:", receipt.transactionHash);
        return receipt;
    } catch (error) {
        logger.error("Error during transaction:", error);
        throw new Error(error.message || "An error occurred during the USD token transfer");
    }
};

exports.validateAddress = validateAddress;
exports.fundTransfer = fundTransfer;

exports.getTransactionDetails = async (hash) => {
    const web3 = initializeWeb3();
    if (!validateTransactionHash(hash)) {
        throw new Error("Invalid transaction hash");
    }
    const transaction = await web3.eth.getTransaction(hash);
    if (!transaction) {
        throw new Error("Transaction not found");
    }
    return {
        from: transaction.from,
        to: transaction.to,
        value: numeral(web3.utils.fromWei(transaction.value.toString())).format('0.0000'),
        gas: transaction.gas,
        gasPrice: numeral(web3.utils.fromWei(transaction.gasPrice.toString())).format('0.0000'),
        blockNumber: transaction.blockNumber,
        transactionHash: transaction.hash,
    };
};

exports.FundTransfer = async (req, res) => {
    const { walletAddress, amount = 10 } = req.params;
    if (!validateAddress(walletAddress)) {
        return res.json({ error: true, message: "Invalid wallet address" });
    }
    try {
        const receipt = await fundTransfer(walletAddress, amount);
        res.json({ error: false, message: "Transfer successful", receipt });
    } catch (error) {
        return res.json({ error: true, message: error.message });
    }
}


// Function to transfer funds
// const fundTransfer = async ( walletAddress, amount) => {
//     // const { walletAddress, amount=10 } = req.body;
//     logger.log("walletAddress", walletAddress, "amount", amount);
//     const web3 = initializeWeb3();
//     // Derived sender account
//     const senderAccount = web3.eth.accounts.privateKeyToAccount(superAdminWalletPrivateKey);
//     web3.eth.accounts.wallet.add(senderAccount);
//     if (!validateAddress(walletAddress)) {
//          throw new Error("Invalid wallet address");    
//     }
//     if (!amount || isNaN(amount) || amount <= 0) {  
//          throw new Error("Invalid amount")
//     }
//     try {
//         const contract = getContractInstance(web3);
//         // const amountInWei = web3.utils.toWei(numeral(amount).format('0.0000'), 'ether'); // Convert to wei
//          try {
//             const nonce = await web3.eth.getTransactionCount(senderAccount.address, 'latest');
//             const gasPrice = await web3.eth.getGasPrice();
//             const tx = {
//             from: senderAccount.address,
//             to: walletAddress,
//             value: web3.utils.toWei(`${amount}`, 'mwei'), // Convert to wei
//             gas: 21000,
//             gasPrice,
//             nonce,
//             };
//             logger.log("Transaction details:", tx);
//             // Sign and send
//             const signedTx = await web3.eth.accounts.signTransaction(tx, superAdminWalletPrivateKey);
//             const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
//             logger.log("Transaction successful with hash:", receipt);
//             return receipt;
//         } catch (error) {
//             logger.error("Error during transaction:", error);
//              throw new Error(error.message || "An error occurred during the fund transfer");
//         }
//     } catch (error) {
//             throw new Error(error.message || "An error occurred during the fund transfer");
//         }    
// }
