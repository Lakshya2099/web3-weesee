// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GameToken.sol";

contract PlayGame {
    GameToken public token;
    uint256 public reward = 10 * 10 ** 18;

    constructor(address tokenAddress) {
        token = GameToken(tokenAddress);
    }

    function play() external {
        token.mint(msg.sender, reward);
    }
}
