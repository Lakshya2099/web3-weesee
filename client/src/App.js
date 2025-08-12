import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

// Import the entire JSON ABI objects
import GameTokenJson from "./abis/GameToken.json";
import TokenStoreJson from "./abis/TokenStore.json";
import PlayGameJson from "./abis/PlayGame.json";

const gameTokenAddr = process.env.REACT_APP_GAME_TOKEN_ADDR;
const tokenStoreAddr = process.env.REACT_APP_TOKEN_STORE_ADDR;
const playGameAddr = process.env.REACT_APP_PLAY_GAME_ADDR;


function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  const [gameToken, setGameToken] = useState(null);
  const [tokenStore, setTokenStore] = useState(null);
  const [playGame, setPlayGame] = useState(null);

  const [balance, setBalance] = useState("0");

  useEffect(() => {
    async function init() {
      // Connect to Metamask provider
      if (window.ethereum) {
        const prov = new ethers.BrowserProvider(window.ethereum);
        setProvider(prov);

        // Request accounts
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const sign = await prov.getSigner();
        setSigner(sign);

        const addr = await sign.getAddress();
        setAccount(addr);

        // Setup contract instances using .abi from imported JSON
        const gameTokenContract = new ethers.Contract(
          gameTokenAddr,
          GameTokenJson.abi,
          sign
        );
        setGameToken(gameTokenContract);

        const tokenStoreContract = new ethers.Contract(
          tokenStoreAddr,
          TokenStoreJson.abi,
          sign
        );
        setTokenStore(tokenStoreContract);

        const playGameContract = new ethers.Contract(
          playGameAddr,
          PlayGameJson.abi,
          sign
        );
        setPlayGame(playGameContract);

        // Fetch and set user's GameToken balance
        const bal = await gameTokenContract.balanceOf(addr);
        setBalance(ethers.formatEther(bal));
      } else {
        alert("Please install MetaMask!");
      }
    }

    init();
  }, []);

  async function buyTokens() {
    if (!tokenStore) return;
    try {
      const tx = await tokenStore.buyTokens({ value: ethers.parseEther("1") });
      await tx.wait();
      alert("Tokens purchased!");
      // Update balance
      const bal = await gameToken.balanceOf(account);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error(err);
      alert("Failed to buy tokens");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Smart Game Platform</h2>
      <p>
        Connected account: <b>{account || "Not connected"}</b>
      </p>
      <p>
        GameToken Balance: <b>{balance}</b> GT
      </p>
      <button onClick={buyTokens}>Buy 1 ETH worth of Tokens</button>
    </div>
  );
}

export default App;
