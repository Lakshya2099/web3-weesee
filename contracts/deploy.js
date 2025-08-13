const { ethers } = require("hardhat");

async function main() {
    console.log("Starting deployment...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()));
    
    // Deploy MockUSDT first for testing
    console.log("\n1. Deploying MockUSDT...");
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const mockUSDT = await MockUSDT.deploy();
    await mockUSDT.deployed();
    console.log("MockUSDT deployed to:", mockUSDT.address);
    
    // Deploy GameToken
    console.log("\n2. Deploying GameToken...");
    const GameToken = await ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();
    console.log("GameToken deployed to:", gameToken.address);
    
    // Deploy TokenStore
    console.log("\n3. Deploying TokenStore...");
    const GT_PER_USDT = ethers.utils.parseEther("1"); // 1 USDT = 1 GT
    const TokenStore = await ethers.getContractFactory("TokenStore");
    const tokenStore = await TokenStore.deploy(mockUSDT.address, gameToken.address, GT_PER_USDT);
    await tokenStore.deployed();
    console.log("TokenStore deployed to:", tokenStore.address);
    
    // Set TokenStore in GameToken
    console.log("\n4. Setting TokenStore in GameToken...");
    await gameToken.setTokenStore(tokenStore.address);
    console.log("TokenStore set successfully");
    
    // Deploy PlayGame
    console.log("\n5. Deploying PlayGame...");
    const PlayGame = await ethers.getContractFactory("PlayGame");
    const playGame = await PlayGame.deploy(gameToken.address, deployer.address);
    await playGame.deployed();
    console.log("PlayGame deployed to:", playGame.address);
    
    // Save addresses
    const addresses = {
        MOCK_USDT: mockUSDT.address,
        GAME_TOKEN: gameToken.address,
        TOKEN_STORE: tokenStore.address,
        PLAY_GAME: playGame.address,
        OPERATOR: deployer.address,
        DEPLOYER: deployer.address
    };
    
    console.log("\n=== Deployment Summary ===");
    console.log(JSON.stringify(addresses, null, 2));
    
    const fs = require('fs');
    fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));
    console.log("\nAddresses saved to deployed-addresses.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
