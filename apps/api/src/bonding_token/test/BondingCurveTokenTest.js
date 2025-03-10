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

    console.log(`Buying ${buyAmount} SEI (wei) worth of tokens`);
    // addr1 buys tokens
    await addr1.sendTransaction({
      to: await token.getAddress(),
      value: buyAmount,
    });

    // Check token balance
    const balance = await token.balanceOf(addr1.address); // balanceOf returns a BigNumber (for some fucking reason idfk why, but in units of Eth, that is, divide it by 1e18 to get units of Wei).
    console.log(`${addr1.address} Token balance (eth): ${balance}`);
    expect(Number(balance)).to.be.gt(0);

    // Check reserve balance
    const reserveBalance = await token.reserveBalance();
    console.log("Reserve balance Sei (wei): ", reserveBalance);
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
    console.log("Price after first buy: ", priceAfterFirstBuy);
    // Second purchase by addr2
    await addr2.sendTransaction({
      to: await token.getAddress(),
      value: secondBuy,
    });
    const priceAfterSecondBuy = await token.getCurrentPrice();
    console.log("Price after second buy: ", priceAfterSecondBuy);

    // The price should increase after the second purchase
    expect(priceAfterSecondBuy > priceAfterFirstBuy).to.equal(true);
  });

  it("should allow users to sell tokens back to the contract and receive SEI", async () => {
    const initialSEIBalance = await ethers.provider.getBalance(addr1.address);
    console.log(
      `Initial SEI balance (wei): ${initialSEIBalance} = ${ethers.formatEther(
        initialSEIBalance
      )} (eth)`
    );

    const contractInitialSEIBalance = await token.reserveBalance();
    console.log(
      `Initial contract SEI balance (wei): ${contractInitialSEIBalance} = ${ethers.formatEther(
        contractInitialSEIBalance
      )} (eth)`
    );

    const buyAmount = ethers.parseEther("200");
    console.log(
      `Buying ${buyAmount} SEI (wei) worth of tokens = ${ethers.formatEther(
        buyAmount
      )} (eth)`
    );
    buyTx = await addr1.sendTransaction({
      to: await token.getAddress(),
      value: buyAmount,
    });
    const buyReceipt = await buyTx.wait();
    const buyGasUsed = buyReceipt.gasUsed * buyReceipt.gasPrice;
    console.log(
      `Buy gas used (wei): ${buyGasUsed} = ${ethers.formatEther(
        buyGasUsed
      )} (eth)`
    );
    const tokenReserveBalanceAfterBuy = await token.reserveBalance();
    expect(tokenReserveBalanceAfterBuy).to.equal(buyAmount);

    const initialTokenBalance = await token.balanceOf(addr1.address);
    console.log(`Token balance after buy: ${initialTokenBalance} (wei)`);
    const tokensToSell = initialTokenBalance;

    console.log(`Selling ${tokensToSell} (wei) tokens`);
    const sellTx = await token.connect(addr1).sellTokens(tokensToSell);

    const sellReceipt = await sellTx.wait();
    const sellGasUsed = sellReceipt.gasUsed * sellReceipt.gasPrice;
    console.log(
      `Sell gas used (wei): ${sellGasUsed} = ${ethers.formatEther(
        sellGasUsed
      )} (eth)`
    );

    // Check final token balance of addr1 (should be 0)
    const finalTokenBalance = await token.balanceOf(addr1.address);
    console.log(`Final token balance: `, finalTokenBalance);
    expect(finalTokenBalance).to.equal(initialTokenBalance - tokensToSell);

    // Check final SEI balance of addr1
    const finalSEIBalance = await ethers.provider.getBalance(addr1.address);
    console.log(`Final SEI balance (wei): `, finalSEIBalance);

    const finalReserveBalance = await token.reserveBalance();
    console.log(
      `Final contract SEI balance (wei): ${finalReserveBalance} = ${ethers.formatEther(
        finalReserveBalance
      )} (eth)`
    );
    expect(finalReserveBalance).to.equal(contractInitialSEIBalance);
    expect(finalSEIBalance + sellGasUsed + buyGasUsed).to.equal(
      initialSEIBalance
    );
  });
});
