// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameToken is ERC20, Ownable {
    address public minter;

    constructor() ERC20("GameToken", "GTK") {
        _mint(msg.sender, 1000 * 10 ** decimals()); // initial supply to deployer
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "Not authorized");
        _mint(to, amount);
    }
}
