import { ethers } from "ethers";
import GameTokenABI from "./abis/GameToken.json";
import TokenStoreABI from "./abis/TokenStore.json";
import PlayGameABI from "./abis/PlayGame.json";

const gameTokenAddress = "YOUR_GAME_TOKEN_DEPLOYED_ADDRESS";
const tokenStoreAddress = "YOUR_TOKEN_STORE_DEPLOYED_ADDRESS";
const playGameAddress = "YOUR_PLAY_GAME_DEPLOYED_ADDRESS";

export function getContracts(provider) {
  const gameToken = new ethers.Contract(gameTokenAddress, GameTokenABI.abi, provider);
  const tokenStore = new ethers.Contract(tokenStoreAddress, TokenStoreABI.abi, provider);
  const playGame = new ethers.Contract(playGameAddress, PlayGameABI.abi, provider);
  return { gameToken, tokenStore, playGame };
}
