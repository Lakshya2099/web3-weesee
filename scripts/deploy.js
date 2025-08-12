const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const GameToken = await hre.ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy();
  await gameToken.waitForDeployment();
  console.log("GameToken deployed at:", gameToken.target);

  const TokenStore = await hre.ethers.getContractFactory("TokenStore");
  const tokenStore = await TokenStore.deploy(gameToken.target);
  await tokenStore.waitForDeployment();
  console.log("TokenStore deployed at:", tokenStore.target);

  const PlayGame = await hre.ethers.getContractFactory("PlayGame");
  const playGame = await PlayGame.deploy(gameToken.target);
  await playGame.waitForDeployment();
  console.log("PlayGame deployed at:", playGame.target);

  // Set minters
  let tx = await gameToken.setMinter(tokenStore.target);
  await tx.wait();
  console.log("TokenStore set as minter in GameToken");

  tx = await gameToken.setMinter(playGame.target);
  await tx.wait();
  console.log("PlayGame set as minter in GameToken");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
