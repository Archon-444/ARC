require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Arc Testnet (PRODUCTION READY)
    // Chain ID: 5042002
    // Native Gas Token: USDC (6 decimals)
    // Block Explorer: https://testnet.arcscan.app
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network",
      chainId: 5042002,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto", // USDC-based gas
      timeout: 60000,
    },
    // Arc Mainnet (PLACEHOLDER - awaiting Circle announcement)
    arcMainnet: {
      url: process.env.ARC_MAINNET_RPC_URL || "https://rpc.arc.network",
      chainId: 999999, // Will be announced by Circle
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      timeout: 60000,
    },
    // Local development
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      arcTestnet: process.env.ARCSCAN_API_KEY || "dummy", // May not be required
    },
    customChains: [
      {
        network: "arcTestnet",
        chainId: 5042002,
        urls: {
          apiURL: "https://testnet.arcscan.app/api",
          browserURL: "https://testnet.arcscan.app"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
