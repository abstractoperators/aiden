const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BondingCurveToken", function () {
  let token, owner, addr1, addr2;

  beforeEach(async () => {
    // Corrected: Use ethers.getSigners() directly
    [owner, addr1, addr2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("BondingCurveToken");
    token = await Token.deploy("BondingCurve", "BCT");
    await token.waitForDeployment();
  });

  it("should allow users to buy tokens successfully", async () => {
    const buyAmount = ethers.parseEther("1");

    console.log(`Buying ${buyAmount} SEI worth of tokens`);
    // addr1 buys tokens
    await addr1.sendTransaction({
      to: await token.getAddress(),
      value: buyAmount,
    });

    // Check token balance
    const balance = await token.balanceOf(addr1.address);
    console.log("Token balance: ", balance);
    expect(Number(balance)).to.be.gt(0);

    // Check reserve balance
    const reserveBalance = await token.reserveBalance();
    console.log("Reserve balance: ", reserveBalance);
    expect(reserveBalance).to.equal(buyAmount);
  });

  it("should adjust the token price according to the bonding curve after purchases", async () => {
    const initialBuy = ethers.parseEther("1"); // 1 SEI
    const secondBuy = ethers.parseEther("2"); // 2 SEI

    // First purchase by addr1
    await addr1.sendTransaction({
      to: await token.getAddress(),
      value: initialBuy,
    });
    const priceAfterFirstBuy = await token.getCurrentPrice();

    // Second purchase by addr2
    await addr2.sendTransaction({
      to: await token.getAddress(),
      value: secondBuy,
    });
    const priceAfterSecondBuy = await token.getCurrentPrice();

    // The price should increase after the second purchase
    expect(priceAfterSecondBuy > priceAfterFirstBuy).to.equal(true);
  });

  it("should allow users to sell tokens back to the contract and receive SEI", async () => {
    const buyAmount = ethers.parseEther("1"); // 1 SEI

    // addr1 buys tokens
    await addr1.sendTransaction({
      to: await token.getAddress(),
      value: buyAmount,
    });

    // Check initial token balance of addr1
    const initialTokenBalance = await token.balanceOf(addr1.address);
    console.log("Initial token balance: ", initialTokenBalance);

    expect(Number(initialTokenBalance)).to.be.gt(0);

    // Check initial SEI balance of addr1
    const initialSEIBalance = await ethers.provider.getBalance(addr1.address);

    // addr1 approves the token transfer back to the contract
    // await token.connect(addr1).approve(token.address, initialTokenBalance);

    // addr1 sells half of their tokens

    const tokensToSell = initialTokenBalance / BigInt(2);

    console.log(`Selling ${tokensToSell} tokens`);
    const sellTx = await token.connect(addr1).sellTokens(tokensToSell);

    const sellReceipt = await sellTx.wait();
    const gasUsed = sellReceipt.gasUsed * sellReceipt.gasPrice;

    // Check final token balance of addr1
    const finalTokenBalance = await token.balanceOf(addr1.address);
    expect(finalTokenBalance).to.equal(initialTokenBalance - tokensToSell);

    // Check final SEI balance of addr1
    const finalSEIBalance = await ethers.provider.getBalance(addr1.address);

    // addr1's SEI balance should have increased by the expected amount minus gas fees
    expect(finalSEIBalance > initialSEIBalance - gasUsed).to.equal(true);
  });
});
