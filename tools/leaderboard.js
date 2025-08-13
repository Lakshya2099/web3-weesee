const { ethers } = require('ethers');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage
let leaderboard = new Map();
let matches = new Map();

// Load addresses
let addresses = {};
try {
    const addressesPath = path.join(__dirname, '..', 'deployed-addresses.json');
    addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    console.log('📍 Loaded contract addresses');
} catch (error) {
    console.error('❌ Error loading addresses:', error.message);
    process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

// Contract ABIs and addresses
const PLAY_GAME_ABI = [
    "event MatchCreated(bytes32 indexed matchId, address indexed p1, address indexed p2, uint256 stake)",
    "event Staked(bytes32 indexed matchId, address indexed player, uint256 amount)",
    "event Settled(bytes32 indexed matchId, address indexed winner, uint256 totalPayout)",
    "event Refunded(bytes32 indexed matchId, address indexed p1, address indexed p2, uint256 refundAmount)"
];

const TOKEN_STORE_ABI = [
    "event Purchase(address indexed buyer, uint256 usdtAmount, uint256 gtOut)"
];

let playGame, tokenStore;

try {
    playGame = new ethers.Contract(addresses.PLAY_GAME, PLAY_GAME_ABI, provider);
    tokenStore = new ethers.Contract(addresses.TOKEN_STORE, TOKEN_STORE_ABI, provider);
    console.log('✅ Contracts initialized');
} catch (error) {
    console.error('❌ Contract initialization error:', error);
    process.exit(1);
}

function updatePlayerStats(address, won, gtAmount) {
    const key = address.toLowerCase();
    if (!leaderboard.has(key)) {
        leaderboard.set(key, {
            address,
            wins: 0,
            losses: 0,
            totalGTWon: '0',
            matchesPlayed: 0
        });
    }
    
    const player = leaderboard.get(key);
    player.matchesPlayed++;
    
    if (won) {
        player.wins++;
        player.totalGTWon = (parseFloat(player.totalGTWon) + parseFloat(ethers.utils.formatEther(gtAmount))).toString();
    } else {
        player.losses++;
    }
    
    leaderboard.set(key, player);
    console.log(`📊 Updated stats for ${address.substring(0, 8)}... - Wins: ${player.wins}, GT Won: ${player.totalGTWon}`);
}

async function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    try {
        // Listen to Purchase events
        tokenStore.on('Purchase', (buyer, usdtAmount, gtOut, event) => {
            console.log(`💰 Purchase: ${buyer.substring(0, 8)}... bought ${ethers.utils.formatEther(gtOut)} GT`);
        });
        
        // Listen to MatchCreated events
        playGame.on('MatchCreated', (matchId, p1, p2, stake, event) => {
            console.log(`🎯 Match Created: ${matchId.substring(0, 10)}... between ${p1.substring(0, 8)}... and ${p2.substring(0, 8)}...`);
            matches.set(matchId, { p1, p2, stake: stake.toString() });
        });
        
        // Listen to Staked events
        playGame.on('Staked', (matchId, player, amount, event) => {
            console.log(`💎 Staked: ${player.substring(0, 8)}... staked ${ethers.utils.formatEther(amount)} GT`);
        });
        
        // Listen to Settled events
        playGame.on('Settled', (matchId, winner, totalPayout, event) => {
            console.log(`🏆 Match Settled: ${winner.substring(0, 8)}... won ${ethers.utils.formatEther(totalPayout)} GT`);
            
            const match = matches.get(matchId);
            if (match) {
                const loser = winner.toLowerCase() === match.p1.toLowerCase() ? match.p2 : match.p1;
                updatePlayerStats(winner, true, totalPayout);
                updatePlayerStats(loser, false, '0');
            }
        });
        
        // Listen to Refunded events
        playGame.on('Refunded', (matchId, p1, p2, refundAmount, event) => {
            console.log(`↩️  Match Refunded: ${matchId.substring(0, 10)}...`);
        });
        
        console.log('✅ Event listeners setup complete');
    } catch (error) {
        console.error('❌ Error setting up event listeners:', error);
    }
}

// API endpoints
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        playersTracked: leaderboard.size,
        matchesTracked: matches.size
    });
});

app.get('/leaderboard', (req, res) => {
    try {
        const sortedPlayers = Array.from(leaderboard.values())
            .sort((a, b) => parseFloat(b.totalGTWon) - parseFloat(a.totalGTWon))
            .slice(0, 10);
        
        console.log(`📊 Leaderboard requested - ${sortedPlayers.length} players`);
        res.json(sortedPlayers);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/player/:address', (req, res) => {
    try {
        const address = req.params.address.toLowerCase();
        const player = leaderboard.get(address);
        
        if (player) {
            res.json(player);
        } else {
            res.json({
                address: req.params.address,
                wins: 0,
                losses: 0,
                totalGTWon: '0',
                matchesPlayed: 0
            });
        }
    } catch (error) {
        console.error('Player stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/stats', (req, res) => {
    try {
        res.json({
            totalPlayers: leaderboard.size,
            totalMatches: matches.size,
            topPlayer: Array.from(leaderboard.values())
                .sort((a, b) => parseFloat(b.totalGTWon) - parseFloat(a.totalGTWon))[0] || null
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.LEADERBOARD_PORT || 3001;

async function start() {
    try {
        await setupEventListeners();
        
        app.listen(PORT, () => {
            console.log(`🚀 Leaderboard service running on port ${PORT}`);
            console.log(`📊 Stats: http://localhost:${PORT}/stats`);
            console.log(`🏆 Leaderboard: http://localhost:${PORT}/leaderboard`);
        });
    } catch (error) {
        console.error('❌ Failed to start leaderboard service:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down leaderboard service...');
    process.exit(0);
});

start();
