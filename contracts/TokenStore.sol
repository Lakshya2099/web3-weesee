// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./GameToken.sol";

contract TokenStore is Ownable, ReentrancyGuard {
    IERC20 public usdt;
    GameToken public gameToken;
    uint256 public gtPerUsdt;
    
    event Purchase(address indexed buyer, uint256 usdtAmount, uint256 gtOut);
    
    // Fixed constructor - removed msg.sender argument
    constructor(address _usdt, address _gameToken, uint256 _gtPerUsdt) {
        require(_usdt != address(0), "Invalid USDT address");
        require(_gameToken != address(0), "Invalid GameToken address");
        require(_gtPerUsdt > 0, "Invalid exchange rate");
        
        usdt = IERC20(_usdt);
        gameToken = GameToken(_gameToken);
        gtPerUsdt = _gtPerUsdt;
    }
    
    function buy(uint256 usdtAmount) external nonReentrant {
        require(usdtAmount > 0, "Amount must be > 0");
        
        uint256 gtOut = (usdtAmount * gtPerUsdt) / 1e6;
        require(gtOut > 0, "GT amount too small");
        
        require(usdt.transferFrom(msg.sender, address(this), usdtAmount), "USDT transfer failed");
        gameToken.mint(msg.sender, gtOut);
        
        emit Purchase(msg.sender, usdtAmount, gtOut);
    }
    
    function withdrawUSDT(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(usdt.transfer(to, amount), "USDT withdrawal failed");
    }
    
    function setGtPerUsdt(uint256 _gtPerUsdt) external onlyOwner {
        require(_gtPerUsdt > 0, "Invalid rate");
        gtPerUsdt = _gtPerUsdt;
    }
}
