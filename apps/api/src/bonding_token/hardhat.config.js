require("@nomicfoundation/hardhat-ethers");

module.exports = {
  solidity: {
      version: "0.8.20",
      settings: {
          evmVersion: "shanghai", // 👈 Force compatibility with SEI Network
          optimizer: {
              enabled: true,
              runs: 200
          }
      }
  }
};
