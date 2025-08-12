require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.20" }, // for your main contracts
      { version: "0.8.0" },  // for OpenZeppelin contracts
      { version: "0.8.28" }  // if Lock.sol or other files require this
    ]
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // You can keep Sepolia here but make sure values aren't undefined
    // sepolia: {
    //   url: process.env.SEPOLIA_URL,
    //   accounts: [process.env.PRIVATE_KEY]
    // }
  }
};
