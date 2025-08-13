// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PlayGame is Ownable, ReentrancyGuard {
    IERC20 public gameToken;
    address public operator;
    uint256 public constant TIMEOUT = 24 hours;
    
    enum MatchStatus { CREATED, STAKED, SETTLED, REFUNDED }
    
    struct Match {
        address p1;
        address p2;
        uint256 stake;
        bool p1Staked;
        bool p2Staked;
        uint256 startTime;
        MatchStatus status;
        address winner;
    }
    
    mapping(bytes32 => Match) public matches;
    
    event MatchCreated(bytes32 indexed matchId, address indexed p1, address indexed p2, uint256 stake);
    event Staked(bytes32 indexed matchId, address indexed player, uint256 amount);
    event Settled(bytes32 indexed matchId, address indexed winner, uint256 totalPayout);
    event Refunded(bytes32 indexed matchId, address indexed p1, address indexed p2, uint256 refundAmount);
    
    // Fixed constructor - removed msg.sender argument
    constructor(address _gameToken, address _operator) {
        require(_gameToken != address(0), "Invalid GameToken address");
        require(_operator != address(0), "Invalid operator address");
        
        gameToken = IERC20(_gameToken);
        operator = _operator;
    }
    
    function setOperator(address _operator) external onlyOwner {
        require(_operator != address(0), "Invalid address");
        operator = _operator;
    }
    
    function createMatch(bytes32 matchId, address p1, address p2, uint256 stake) external onlyOwner {
        require(matches[matchId].p1 == address(0), "Match already exists");
        require(p1 != address(0) && p2 != address(0), "Invalid player addresses");
        require(p1 != p2, "Players must be different");
        require(stake > 0, "Stake must be > 0");
        
        matches[matchId] = Match({
            p1: p1,
            p2: p2,
            stake: stake,
            p1Staked: false,
            p2Staked: false,
            startTime: 0,
            status: MatchStatus.CREATED,
            winner: address(0)
        });
        
        emit MatchCreated(matchId, p1, p2, stake);
    }
    
    function stake(bytes32 matchId) external nonReentrant {
        Match storage matchData = matches[matchId];
        require(matchData.status == MatchStatus.CREATED, "Invalid match status");
        require(msg.sender == matchData.p1 || msg.sender == matchData.p2, "Not a player");
        
        bool isP1 = msg.sender == matchData.p1;
        require(!(isP1 ? matchData.p1Staked : matchData.p2Staked), "Already staked");
        
        require(gameToken.transferFrom(msg.sender, address(this), matchData.stake), "Stake transfer failed");
        
        if (isP1) {
            matchData.p1Staked = true;
        } else {
            matchData.p2Staked = true;
        }
        
        if (matchData.p1Staked && matchData.p2Staked) {
            matchData.status = MatchStatus.STAKED;
            matchData.startTime = block.timestamp;
        }
        
        emit Staked(matchId, msg.sender, matchData.stake);
    }
    
    function commitResult(bytes32 matchId, address winner) external nonReentrant {
        require(msg.sender == operator, "Only operator can commit results");
        Match storage matchData = matches[matchId];
        require(matchData.status == MatchStatus.STAKED, "Match not ready for result");
        require(winner == matchData.p1 || winner == matchData.p2, "Invalid winner");
        
        matchData.status = MatchStatus.SETTLED;
        matchData.winner = winner;
        
        uint256 totalPayout = matchData.stake * 2;
        require(gameToken.transfer(winner, totalPayout), "Payout failed");
        
        emit Settled(matchId, winner, totalPayout);
    }
    
    function refund(bytes32 matchId) external nonReentrant {
        Match storage matchData = matches[matchId];
        require(matchData.status == MatchStatus.STAKED, "Invalid status for refund");
        require(block.timestamp >= matchData.startTime + TIMEOUT, "Timeout not reached");
        
        matchData.status = MatchStatus.REFUNDED;
        
        if (matchData.p1Staked) {
            require(gameToken.transfer(matchData.p1, matchData.stake), "P1 refund failed");
        }
        if (matchData.p2Staked) {
            require(gameToken.transfer(matchData.p2, matchData.stake), "P2 refund failed");
        }
        
        emit Refunded(matchId, matchData.p1, matchData.p2, matchData.stake);
    }
}
