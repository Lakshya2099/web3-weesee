# 🎮 Blockchain Gaming Platform

A decentralized gaming platform built on Ethereum that allows players to stake Game Tokens (GT) in matches and compete for rewards.

## 🚀 Features

- **Token Economy**: USDT-based token acquisition system
- **Game Token (GT) Trading**: Purchase GT tokens using USDT
- **Match System**: Create and participate in staked matches
- **Leaderboard**: Track top players and their winnings
- **Real-time Events**: Monitor blockchain transactions and game events
- **MetaMask Integration**: Seamless wallet connectivity

## 🏗️ Architecture

### Smart Contracts
- **MockUSDT**: Test USDT token for purchasing GT
- **GameToken (GT)**: Primary gaming currency
- **TokenStore**: Handles USDT to GT token exchanges
- **PlayGame**: Manages match creation, staking, and results

### Services
- **API Server**: Backend REST API for contract interactions
- **Leaderboard Service**: Player statistics and rankings
- **Web Frontend**: React-based user interface
- **Hardhat Node**: Local Ethereum blockchain for development

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **MetaMask** browser extension
- **Git**

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone 
cd blockchain-game
```

2. **Install dependencies**
```bash
npm install
cd api && npm install
cd ../tools && npm install
cd ..
```

3. **Set up environment variables**
Create `.env` files in root and api directories:

**Root `.env`:**
```env
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://localhost:8545
```

**`api/.env`:**
```env
RPC_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
PORT=3000
```

**`tools/.env`:**
```env
RPC_URL=http://localhost:8545
LEADERBOARD_PORT=3001
```

## 🚀 Running the Application

You need to run **5 services simultaneously** in separate terminals:

### **Terminal 1: Start Blockchain**
```bash
npx hardhat node
```

### **Terminal 2: Deploy Contracts**
```bash
npx hardhat run contracts/deploy.js --network localhost
```

### **Terminal 3: Start API Server**
```bash
cd api
npm start
```

### **Terminal 4: Start Leaderboard Service**
```bash
cd tools
npm start
```

### **Terminal 5: Start Web Frontend**
```bash
cd web
http-server -p 8080
```

## 🌐 Access Points

- **Game Interface**: http://localhost:8080
- **API Health Check**: http://localhost:3000/health
- **Contract Addresses**: http://localhost:3000/addresses
- **Leaderboard**: http://localhost:3001/leaderboard

## 🎮 How to Play

### **1. Setup MetaMask**
- Add Localhost Network:
  - Network Name: `Localhost 8545`
  - RPC URL: `http://127.0.0.1:8545`
  - Chain ID: `31337`
  - Currency Symbol: `ETH`

### **2. Import Test Accounts**
Import these private keys into MetaMask:

**Player 1:**
```
0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

**Player 2:**
```
0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

### **3. Get Tokens**
1. **Get Free USDT**: Mint test USDT tokens
2. **Buy GT Tokens**: Exchange USDT for Game Tokens

### **4. Create and Play Matches**
1. **Create Match**: Set match ID, players, and stake amount
2. **Stake Tokens**: Both players must stake their GT tokens
3. **Submit Results**: Game operator submits match winner
4. **Collect Winnings**: Winner receives 2x stake amount

## 🔧 API Endpoints

### **Game Management**
- `POST /mint-usdt` - Mint test USDT tokens
- `GET /purchase?amount={amount}` - Buy GT tokens
- `POST /match/start` - Create new match
- `POST /stake` - Stake tokens in match
- `POST /match/result` - Submit match results

### **Information**
- `GET /health` - API health status
- `GET /addresses` - Contract addresses
- `GET /leaderboard` - Player rankings (port 3001)

## 🏆 Game Mechanics

### **Token Economy**
- **1 USDT = 1 GT** (fixed exchange rate)
- **Initial USDT**: Free minting for testing
- **Match Stakes**: Minimum 1 GT per match

### **Match Flow**
1. **CREATED**: Match initialized by operator
2. **STAKED**: Both players have staked tokens
3. **SETTLED**: Results submitted, winner receives payout

### **Rewards**
- **Winner**: Receives 2x original stake amount
- **Loser**: Loses staked amount
- **Platform**: No fees (all stakes go to winner)

## 📊 Testing Scenarios

### **Single Player Test**
```bash
# Get tokens
1. Get Free USDT: 1000
2. Buy GT: 100

# Create match (as deployer)
3. Match ID: test-001
4. Player 1: Your address
5. Player 2: Another test address
6. Stake: 10 GT

# Complete match
7. Stake as Player 1
8. Submit result with winner
```

### **Two Player Test**
```bash
# Tab 1 (Player 1)
1. Import Account #1, get tokens
2. Create match, stake tokens

# Tab 2 (Player 2)  
3. Import Account #2, get tokens
4. Stake in same match

# Tab 1 (Switch to deployer)
5. Submit match results
```

## 🐛 Troubleshooting

### **Common Issues**

**"Connection Refused" Errors:**
- Ensure all 5 services are running
- Check ports 3000, 3001, 8080, 8545 are available

**"Insufficient Allowance" Errors:**
- Get USDT tokens before buying GT
- Ensure sufficient GT balance for staking

**MetaMask Connection Issues:**
- Reset account in MetaMask settings
- Verify correct network (Localhost 8545)
- Clear browser cache

**Block Synchronization Issues:**
- Reset MetaMask account
- Restart Hardhat node
- Redeploy contracts

## 📁 Project Structure

```
blockchain-game/
├── contracts/           # Smart contracts and deployment
├── api/                # Backend REST API server
├── tools/              # Leaderboard service
├── web/                # Frontend application
├── hardhat.config.js   # Hardhat configuration
├── package.json        # Project dependencies
└── README.md          # This file
```

## 🔐 Security Notes

- **Test Environment Only**: Uses deterministic private keys
- **Local Development**: Not suitable for production deployment
- **Mock Tokens**: USDT tokens have no real value

## 🛣️ Roadmap

- [ ] Multi-game support
- [ ] Tournament system  
- [ ] NFT rewards
- [ ] Mobile application
- [ ] Mainnet deployment

## 📄 License

MIT License - see LICENSE file for details
