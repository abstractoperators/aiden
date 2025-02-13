// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BondingCurveToken is ERC20, ReentrancyGuard {
    uint256 public reserveBalance; // SEI held in contract
    uint256 public constant k = 0.001 ether; // Price coefficient

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function buyTokens() external payable nonReentrant {
        require(msg.value > 0, "Send SEI to buy tokens");

        uint256 supply = totalSupply();
        uint256 amountToMint = calculateTokensForETH(msg.value, supply);
        require(amountToMint > 0, "Not enough SEI to mint tokens");

        reserveBalance += msg.value;
        _mint(msg.sender, amountToMint);
    }

    function sellTokens(uint256 amount) external nonReentrant {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        uint256 supply = totalSupply();
        uint256 ethToReturn = calculateETHForTokens(amount, supply);
        require(ethToReturn <= reserveBalance, "Not enough SEI in reserve");

        _burn(msg.sender, amount);
        reserveBalance -= ethToReturn;
        payable(msg.sender).transfer(ethToReturn);
    }

    function getCurrentPrice() public view returns (uint256) {
        return totalSupply() * k;
    }

    function calculateTokensForETH(uint256 ethAmount, uint256 supply) public pure returns (uint256) {
        uint256 newSupply = supply + ((2 * ethAmount) / k + supply * supply)**0.5;
        return newSupply - supply;
    }

    function calculateETHForTokens(uint256 tokenAmount, uint256 supply) public pure returns (uint256) {
        uint256 newSupply = supply - tokenAmount;
        require(newSupply >= 0, "Invalid token amount");

        return (k / 2) * (supply * supply - newSupply * newSupply);
    }

    receive() external payable {
        buyTokens();
    }
}
