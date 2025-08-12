// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GameToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenStore is Ownable {
    GameToken public token;
    uint256 public pricePerToken = 0.01 ether;

    constructor(address tokenAddress) {
        token = GameToken(tokenAddress);
    }

    function buyTokens(uint256 amount) external payable {
        require(msg.value >= amount * pricePerToken, "Insufficient ETH");
        token.mint(msg.sender, amount * 10 ** token.decimals());
    }

    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
