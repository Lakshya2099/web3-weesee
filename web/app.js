let provider, signer, userAddress;
let gameToken, tokenStore, playGame, mockUSDT;
let addresses = {};

const API_BASE = 'http://localhost:3000';
const LEADERBOARD_API = 'http://localhost:3001';

// Updated Contract ABIs
const GAME_TOKEN_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "event Minted(address indexed to, uint256 amount)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const MOCK_USDT_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function mint(address to, uint256 amount)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const PLAY_GAME_ABI = [
    "function stake(bytes32 matchId)",
    "function matches(bytes32) view returns (address, address, uint256, bool, bool, uint256, uint8, address)",
    "function createMatch(bytes32 matchId, address p1, address p2, uint256 stake) external",
    "function commitResult(bytes32 matchId, address winner) external",
    "event MatchCreated(bytes32 indexed matchId, address indexed p1, address indexed p2, uint256 stake)",
    "event Staked(bytes32 indexed matchId, address indexed player, uint256 amount)",
    "event Settled(bytes32 indexed matchId, address indexed winner, uint256 totalPayout)"
];

async function loadAddresses() {
    try {
        const response = await fetch(`${API_BASE}/addresses`);
        addresses = await response.json();
        console.log('Loaded addresses:', addresses);
    } catch (error) {
        console.error('Failed to load addresses:', error);
        showStatus('walletInfo', 'Failed to load contract addresses. Make sure API is running!', 'error');
    }
}

async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            showStatus('walletInfo', 'MetaMask not detected! Please install MetaMask.', 'error');
            return;
        }

        await loadAddresses();

        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        
        // Initialize contracts
        if (addresses.GAME_TOKEN) {
            gameToken = new ethers.Contract(addresses.GAME_TOKEN, GAME_TOKEN_ABI, signer);
            mockUSDT = new ethers.Contract(addresses.MOCK_USDT, MOCK_USDT_ABI, signer);
            playGame = new ethers.Contract(addresses.PLAY_GAME, PLAY_GAME_ABI, signer);
        }
        
        document.getElementById('walletInfo').innerHTML = 
            `<div class="success">✅ Connected: ${userAddress.substring(0, 8)}...${userAddress.substring(34)}</div>`;
        
        document.getElementById('player1').value = userAddress;
        
        await updateBalances();
        showStatus('walletInfo', 'Wallet connected successfully!', 'success');
    } catch (error) {
        console.error('Wallet connection error:', error);
        showStatus('walletInfo', `Connection failed: ${error.message}`, 'error');
    }
}

async function updateBalances() {
    try {
        if (gameToken && mockUSDT && userAddress) {
            const gtBalance = await gameToken.balanceOf(userAddress);
            const usdtBalance = await mockUSDT.balanceOf(userAddress);
            
            document.getElementById('gtBalance').textContent = 
                `🪙 GT Balance: ${parseFloat(ethers.utils.formatEther(gtBalance)).toFixed(4)} GT`;
            document.getElementById('usdtBalance').textContent = 
                `💵 USDT Balance: ${parseFloat(ethers.utils.formatUnits(usdtBalance, 6)).toFixed(6)} USDT`;
        }
    } catch (error) {
        console.error('Balance update error:', error);
    }
}

async function mintUSDT() {
    try {
        const amount = document.getElementById('mintAmount').value;
        if (!amount || !userAddress) {
            showStatus('mintStatus', 'Please connect wallet and enter amount', 'error');
            return;
        }
        
        showStatus('mintStatus', 'Minting USDT...', 'info');
        
        const response = await fetch(`${API_BASE}/mint-usdt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: userAddress, amount })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('mintStatus', `✅ Minted ${amount} USDT! TX: ${result.txHash.substring(0, 12)}...`, 'success');
            setTimeout(updateBalances, 2000);
        } else {
            showStatus('mintStatus', `❌ Minting failed: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('USDT mint error:', error);
        showStatus('mintStatus', `❌ Error: ${error.message}`, 'error');
    }
}

// FIXED: Simplified Purchase Function
async function approveAndBuyGT() {
    try {
        const amount = document.getElementById('usdtAmount').value;
        if (!amount) {
            showStatus('purchaseStatus', 'Please enter amount', 'error');
            return;
        }
        
        showStatus('purchaseStatus', '🔄 Processing purchase...', 'info');
        
        // Call API directly - let backend handle everything
        const response = await fetch(`${API_BASE}/purchase?amount=${amount}`);
        const result = await response.json();
        
        if (result.success) {
            showStatus('purchaseStatus', `✅ Success! TX: ${result.txHash.substring(0, 12)}...`, 'success');
            setTimeout(updateBalances, 2000);
        } else {
            showStatus('purchaseStatus', `❌ Failed: ${result.error}`, 'error');
        }
    } catch (error) {
        showStatus('purchaseStatus', `❌ Error: ${error.message}`, 'error');
    }
}

async function createMatch() {
    try {
        const matchId = document.getElementById('matchId').value;
        const p1 = document.getElementById('player1').value;
        const p2 = document.getElementById('player2').value;
        const stake = document.getElementById('stakeAmount').value;
        
        if (!matchId || !p1 || !p2 || !stake) {
            showStatus('matchStatus', 'All fields are required', 'error');
            return;
        }
        
        showStatus('matchStatus', '🔄 Creating match...', 'info');
        
        const response = await fetch(`${API_BASE}/match/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId, p1, p2, stake })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('matchStatus', `✅ Match created! TX: ${result.txHash.substring(0, 12)}...`, 'success');
            document.getElementById('stakeMatchId').value = matchId;
        } else {
            showStatus('matchStatus', `❌ Failed: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Match creation error:', error);
        showStatus('matchStatus', `❌ Error: ${error.message}`, 'error');
    }
}

// FIXED: Backend-handled staking
async function approveAndStake() {
    try {
        const matchId = document.getElementById('stakeMatchId').value;
        const stakeAmount = document.getElementById('stakeAmount').value;
        
        if (!matchId || !stakeAmount) {
            showStatus('matchStatus', 'Please enter match ID and stake amount', 'error');
            return;
        }
        
        showStatus('matchStatus', '🔄 Staking...', 'info');
        
        // Send all required fields
        const response = await fetch(`${API_BASE}/stake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                matchId: matchId,
                playerAddress: userAddress,
                stakeAmount: stakeAmount
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('matchStatus', `✅ Staked! TX: ${result.txHash.substring(0, 12)}...`, 'success');
            setTimeout(updateBalances, 2000);
        } else {
            showStatus('matchStatus', `❌ Failed: ${result.error}`, 'error');
        }
    } catch (error) {
        showStatus('matchStatus', `❌ Error: ${error.message}`, 'error');
    }
}

async function submitResult() {
    try {
        const matchId = document.getElementById('resultMatchId').value;
        const winner = document.getElementById('winner').value;
        
        if (!matchId || !winner) {
            showStatus('resultStatus', 'Match ID and winner are required', 'error');
            return;
        }
        
        showStatus('resultStatus', '🔄 Submitting result...', 'info');
        
        const response = await fetch(`${API_BASE}/match/result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId, winner })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('resultStatus', `✅ Result submitted! TX: ${result.txHash.substring(0, 12)}...`, 'success');
        } else {
            showStatus('resultStatus', `❌ Failed: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Result submission error:', error);
        showStatus('resultStatus', `❌ Error: ${error.message}`, 'error');
    }
}

async function loadLeaderboard() {
    try {
        const response = await fetch(`${LEADERBOARD_API}/leaderboard`);
        const data = await response.json();
        
        let html = '<h3>🏆 Top Players</h3>';
        if (data.length === 0) {
            html += '<p>No players yet. Play some matches!</p>';
        } else {
            html += '<table style="width:100%; border-collapse: collapse;">';
            html += '<tr style="background:#f8f9fa;"><th style="padding:8px;border:1px solid #ddd;">Rank</th><th style="padding:8px;border:1px solid #ddd;">Address</th><th style="padding:8px;border:1px solid #ddd;">Wins</th><th style="padding:8px;border:1px solid #ddd;">GT Won</th></tr>';
            
            data.forEach((player, index) => {
                html += `<tr>
                    <td style="padding:8px;border:1px solid #ddd;text-align:center;">${index + 1}</td>
                    <td style="padding:8px;border:1px solid #ddd;">${player.address.substring(0, 8)}...</td>
                    <td style="padding:8px;border:1px solid #ddd;text-align:center;">${player.wins}</td>
                    <td style="padding:8px;border:1px solid #ddd;text-align:center;">${parseFloat(player.totalGTWon).toFixed(2)}</td>
                </tr>`;
            });
            html += '</table>';
        }
        
        document.getElementById('leaderboard').innerHTML = html;
    } catch (error) {
        console.error('Leaderboard error:', error);
        document.getElementById('leaderboard').innerHTML = '<p>❌ Failed to load leaderboard.</p>';
    }
}

async function loadEvents() {
    try {
        const events = [];
        
        if (gameToken && mockUSDT && playGame) {
            const latestBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, latestBlock - 1000);
            
            try {
                const mintEvents = await gameToken.queryFilter('Minted', fromBlock);
                events.push(...mintEvents.map(e => ({ type: '🪙 Minted', ...e })));
            } catch (e) { console.log('Error getting mint events:', e.message); }
            
            try {
                const matchEvents = await playGame.queryFilter('MatchCreated', fromBlock);
                const stakeEvents = await playGame.queryFilter('Staked', fromBlock);
                const settledEvents = await playGame.queryFilter('Settled', fromBlock);
                
                events.push(...matchEvents.map(e => ({ type: '🎯 Match Created', ...e })));
                events.push(...stakeEvents.map(e => ({ type: '💰 Staked', ...e })));
                events.push(...settledEvents.map(e => ({ type: '🏆 Settled', ...e })));
            } catch (e) { console.log('Error getting game events:', e.message); }
        }
        
        events.sort((a, b) => b.blockNumber - a.blockNumber);
        
        let html = '<h3>📋 Recent Events</h3>';
        if (events.length === 0) {
            html += '<div class="event-item">No events found. Try some transactions!</div>';
        } else {
            events.slice(0, 10).forEach(event => {
                html += `<div class="event-item">
                    <strong>${event.type}</strong><br>
                    <small>Block ${event.blockNumber} | TX: ${event.transactionHash.substring(0, 12)}...</small>
                </div>`;
            });
        }
        
        document.getElementById('events').innerHTML = html;
    } catch (error) {
        console.error('Events loading error:', error);
        document.getElementById('events').innerHTML = '<div class="event-item">❌ Failed to load events</div>';
    }
}

function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="status ${type}">${message}</div>`;
    if (type === 'success' || type === 'info') {
        setTimeout(() => element.innerHTML = '', 5000);
    }
}

document.getElementById('connectWallet').addEventListener('click', connectWallet);

window.addEventListener('load', () => {
    if (typeof window.ethereum !== 'undefined') {
        connectWallet();
    }
});

setInterval(() => {
    if (userAddress) updateBalances();
}, 10000);
