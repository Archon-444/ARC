require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Arc testnet configuration
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.arc.testnet.circle.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1234, // Replace with actual Arc testnet chain ID
    },
    // Arc mainnet configuration
    arcMainnet: {
      url: process.env.ARC_MAINNET_RPC_URL || "https://rpc.arc.circle.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 5678, // Replace with actual Arc mainnet chain ID
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
