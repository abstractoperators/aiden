// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BondingCurveToken is ERC20, ReentrancyGuard {
    uint256 public reserveBalance; // SEI held in contract
    uint256 public constant k = 0.001 ether; // Price coefficient - 1 SEI = 0.001

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function buyTokens() external payable nonReentrant {
        _buyTokens();
    }
    
    function _buyTokens() internal {
        require(msg.value > 0, "Send SEI to buy tokens");

        uint256 supply = totalSupply();
        uint256 amountToMint = calculateTokensForSEI(msg.value, supply);
        require(amountToMint > 0, "Not enough SEI to mint tokens");

        reserveBalance += msg.value;
        _mint(msg.sender, amountToMint);
    }

    function sellTokens(uint256 amount) external nonReentrant {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        uint256 supply = totalSupply();
        uint256 ethToReturn = calculateSEIForTokens(amount, supply);
        require(ethToReturn <= reserveBalance, "Not enough SEI in reserve");

        _burn(msg.sender, amount);
        reserveBalance -= ethToReturn;
        payable(msg.sender).transfer(ethToReturn);
    }

    function getCurrentPrice() public view returns (uint256) {
        return totalSupply() * k;
    }

    function calculateTokensForSEI(uint256 ethAmount, uint256 supply) public pure returns (uint256) {
        uint256 newSupply = supply + sqrt((2 * ethAmount) / k + supply * supply);
        return newSupply - supply;
    }
    function calculateSEIForTokens(uint256 tokenAmount, uint256 supply) public pure returns (uint256) {
        uint256 newSupply = supply - tokenAmount;
        require(newSupply >= 0, "Invalid token amount");

        return (k / 2) * (supply * supply - newSupply * newSupply);
    }

    // Babylonian method to calculate square root.
    // https://ethereum.stackexchange.com/questions/2910/can-i-square-root-in-solidity/2913#2913
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    receive() external payable {
        _buyTokens();
    }
}
