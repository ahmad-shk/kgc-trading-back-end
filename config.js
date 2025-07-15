
// const RPC_URL_TESTNET = 'https://sepolia.infura.io/v3/4962a3356b084e859d8dc296c658962b'
const RPC_URL = 'https://bnb-mainnet.g.alchemy.com/v2/t2m-k706O1_CKUrV_fIYVVYYdew4oZrx' // Replace with actual RPC URL
// const RPC_URL = 'https://bsc-testnet-rpc.publicnode.com' // Replace with actual RPC URL
const TOKEN_CONTRACT_ADDRESS = '0x8D2F725F26242C6eb6CFa36e207D47D538c5E074'
const superAdminWalletAddress = '0x67Bb3DfaC2ceDCC5EA189345df9f06BBebb33AFe'; // Replace with actual super admin address
const superAdminWalletPrivateKey = '4292c0ae72fba0460eb4a9bc06ac00df439b55194a7293b22a76e238beb206e4'
const botAddressList = [
    '0x67Bb3DfaC2ceDCC5EA189345df9f06BBebb33AFe', // Super Admin
    '0x1234567890abcdef1234567890abcdef12345678', // Example Bot Address 1
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // Example Bot Address 2
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // Example Bot Address 3
];
const LEVERAGE = [0, 5, 10, 15, 20, 25, 30, 35, 40];

module.exports = { RPC_URL, TOKEN_CONTRACT_ADDRESS, superAdminWalletAddress , botAddressList, superAdminWalletPrivateKey, LEVERAGE };
