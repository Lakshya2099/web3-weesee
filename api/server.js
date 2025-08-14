const express = require('express');
const cors = require('cors');
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Load contract addresses
let addresses = {};
try {
    const addressesPath = path.join(__dirname, '..', 'deployed-addresses.json');
    addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    console.log('✅ Loaded contract addresses:', addresses);
} catch (error) {
    console.error('❌ Error loading addresses:', error.message);
}

// Initialize provider and contracts
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);

// Contract ABIs
const MOCK_USDT_ABI = [
    "function mint(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)"
];

const TOKEN_STORE_ABI = [
    "function buy(uint256 usdtAmount) external"
];

const GAME_TOKEN_ABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)"
];

const PLAY_GAME_ABI = [
    "function createMatch(bytes32 matchId, address p1, address p2, uint256 stake) external",
    "function commitResult(bytes32 matchId, address winner) external",
    "function stake(bytes32 matchId) external"
];

// Initialize contracts
let mockUSDT, tokenStore, playGame, gameToken;

try {
    if (addresses.MOCK_USDT) {
        mockUSDT = new ethers.Contract(addresses.MOCK_USDT, MOCK_USDT_ABI, wallet);
    }
    if (addresses.TOKEN_STORE) {
        tokenStore = new ethers.Contract(addresses.TOKEN_STORE, TOKEN_STORE_ABI, wallet);
    }
    if (addresses.PLAY_GAME) {
        playGame = new ethers.Contract(addresses.PLAY_GAME, PLAY_GAME_ABI, wallet);
    }
    if (addresses.GAME_TOKEN) {
        gameToken = new ethers.Contract(addresses.GAME_TOKEN, GAME_TOKEN_ABI, wallet);
    }
    console.log('✅ Contracts initialized successfully');
} catch (error) {
    console.error('❌ Error initializing contracts:', error.message);
}

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/addresses', (req, res) => {
    res.json(addresses);
});

// USDT Minting endpoint
app.post('/mint-usdt', async (req, res) => {
    try {
        const { to, amount } = req.body;
        if (!to || !amount) {
            return res.status(400).json({ error: 'to and amount are required' });
        }

        console.log(`Minting ${amount} USDT to ${to}`);
        
        const usdtAmount = ethers.utils.parseUnits(amount, 6);
        const tx = await mockUSDT.mint(to, usdtAmount);
        const receipt = await tx.wait();

        res.json({
            success: true,
            txHash: receipt.transactionHash,
            message: `Minted ${amount} USDT to ${to}`
        });
    } catch (error) {
        console.error('USDT mint error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// GT Purchase endpoint
app.get('/purchase', async (req, res) => {
    try {
        const { amount } = req.query;
        if (!amount) {
            return res.status(400).json({ error: 'Amount is required' });
        }
        
        console.log(`Processing purchase: ${amount} USDT`);
        
        // Convert amount to proper format
        const usdtAmount = ethers.utils.parseUnits(amount, 6);
        
        // First approve USDT (using the deployer account)
        console.log('Step 1: Approving USDT...');
        const approveTx = await mockUSDT.approve(addresses.TOKEN_STORE, usdtAmount);
        const approveReceipt = await approveTx.wait();
        console.log('Approval TX:', approveReceipt.transactionHash);
        
        // Wait a moment for the approval to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Then buy GT tokens
        console.log('Step 2: Purchasing GT...');
        const tx = await tokenStore.buy(usdtAmount);
        const receipt = await tx.wait();
        
        console.log('Purchase successful:', receipt.transactionHash);
        
        res.json({
            success: true,
            txHash: receipt.transactionHash,
            message: `Successfully purchased GT with ${amount} USDT`
        });
    } catch (error) {
        console.error('Purchase error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Staking endpoint
// EMERGENCY FIX: Simple staking endpoint
app.post('/stake', async (req, res) => {
    try {
        const { matchId, playerAddress, stakeAmount, gasLimit } = req.body;
        
        console.log('Stake request:', { matchId, playerAddress, stakeAmount });
        
        // Use manual gas limit if provided, otherwise estimate
        const txOptions = {};
        if (gasLimit) {
            txOptions.gasLimit = gasLimit;
        }
        
        const matchIdBytes = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(matchId));
        
        // Call stake function with manual gas limit
        const tx = await playGame.stake(matchIdBytes, txOptions);
        await tx.wait();
        
        res.json({ 
            success: true, 
            message: 'Tokens staked successfully',
            txHash: tx.hash 
        });
        
    } catch (error) {
        console.error('Staking API Error:', error);
        res.json({ success: false, error: error.message });
    }
});


// Match creation endpoint
// In your API server (api/server.js), check this endpoint:
app.post('/match/start', async (req, res) => {
    try {
        const { matchId, p1, p2, stake } = req.body;
        
        console.log('API received:', { matchId, p1, p2, stake });
        
        // Make sure addresses are different
        if (p1.toLowerCase() === p2.toLowerCase()) {
            return res.json({ success: false, error: 'Players must be different (API check)' });
        }
        
        // Use the correct function name from your contract
        const matchIdBytes = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(matchId));
        
        // Try different possible function names:
        let tx;
        try {
            // Option 1: Try createMatch
            tx = await playGame.createMatch(matchIdBytes, p1, p2, ethers.utils.parseEther(stake.toString()));
        } catch (error1) {
            try {
                // Option 2: Try initMatch  
                tx = await playGame.initMatch(matchIdBytes, p1, p2, ethers.utils.parseEther(stake.toString()));
            } catch (error2) {
                try {
                    // Option 3: Try newMatch
                    tx = await playGame.newMatch(matchIdBytes, p1, p2, ethers.utils.parseEther(stake.toString()));
                } catch (error3) {
                    console.error('All function attempts failed:', { error1: error1.message, error2: error2.message, error3: error3.message });
                    return res.json({ success: false, error: 'Function not found in contract' });
                }
            }
        }
        
        await tx.wait();
        
        res.json({ 
            success: true, 
            message: 'Match created successfully',
            txHash: tx.hash 
        });
        
    } catch (error) {
        console.error('API Error:', error);
        res.json({ success: false, error: error.message });
    }
});


// Match result submission endpoint
app.post('/match/result', async (req, res) => {
    try {
        const { matchId, winner } = req.body;
        if (!matchId || !winner) {
            return res.status(400).json({ error: 'matchId and winner are required' });
        }

        console.log(`Submitting result for match: ${matchId}, winner: ${winner}`);
        
        const matchIdBytes = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(matchId));
        const tx = await playGame.commitResult(matchIdBytes, winner);
        const receipt = await tx.wait();

        res.json({
            success: true,
            txHash: receipt.transactionHash,
            message: `Result submitted for match ${matchId}`
        });
    } catch (error) {
        console.error('Result submission error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});
app.get('/debug', async (req, res) => {
    try {
        const balances = {
            deployer_eth: await provider.getBalance(wallet.address),
            deployer_gt: await gameToken.balanceOf(wallet.address),
            deployer_usdt: await mockUSDT.balanceOf(wallet.address)
        };
        
        res.json({
            success: true,
            wallet_address: wallet.address,
            balances: balances,
            contracts: addresses
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`📋 Addresses: http://localhost:${PORT}/addresses`);
});
