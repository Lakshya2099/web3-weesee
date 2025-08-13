// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameToken is ERC20, Ownable {
    address public tokenStore;
    
    event Minted(address indexed to, uint256 amount);
    
    // Fixed constructor - removed msg.sender argument for v4.x compatibility
    constructor() ERC20("GameToken", "GT") {}
    
    function setTokenStore(address _tokenStore) external onlyOwner {
        require(_tokenStore != address(0), "Invalid address");
        tokenStore = _tokenStore;
    }
    
    function mint(address to, uint256 amount) external {
        require(msg.sender == tokenStore, "Only TokenStore can mint");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        
        _mint(to, amount);
        emit Minted(to, amount);
    }
}
