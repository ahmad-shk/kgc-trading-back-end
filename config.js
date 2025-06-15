
const RPC_URL = 'https://sepolia.infura.io/v3/4962a3356b084e859d8dc296c658962b'
const TOKEN_CONTRACT_ADDRESS = '0x0207AAa99687275ecc91A389e0D4f6629Fd08ddD'
const superAdminWalletAddress = '0x67Bb3DfaC2ceDCC5EA189345df9f06BBebb33AFe'; // Replace with actual super admin address
const botAddressList = [
    '0x67Bb3DfaC2ceDCC5EA189345df9f06BBebb33AFe', // Super Admin
    '0x1234567890abcdef1234567890abcdef12345678', // Example Bot Address 1
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // Example Bot Address 2
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // Example Bot Address 3
];
const LEVERAGE = [0, 5, 10, 15, 20, 25, 30, 35, 40];

module.exports = { RPC_URL, TOKEN_CONTRACT_ADDRESS, superAdminWalletAddress , botAddressList};
