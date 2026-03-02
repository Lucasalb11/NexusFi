// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CreditScoreAttestation
 * @notice Stores AI credit scores attested by Chainlink CRE WF2.
 *
 * Only the Chainlink CRE Forwarder can write scores.
 * Scores are derived from on-chain Stellar transaction history
 * analyzed by the CRE workflow (with optional LLM integration).
 *
 * Deployed on: Ethereum Sepolia Testnet
 * CRE Forwarder: 0x15fc6ae953e024d975e77382eeec56a9101f9f88
 */
contract CreditScoreAttestation {
    // =========================================================================
    // State
    // =========================================================================

    address public immutable CRE_FORWARDER;
    address public owner;

    uint256 public constant MAX_SCORE = 1000;
    uint256 public constant MAX_HISTORY_PER_USER = 10;

    struct ScoreRecord {
        uint256 score;        // 0-1000
        uint256 txCount;      // on-chain transaction count at time of scoring
        uint256 accountAgeDays;
        uint256 timestamp;
        bytes32 metadataHash; // keccak256 of full off-chain analysis metadata
    }

    mapping(address => ScoreRecord) public latestScore;
    mapping(address => ScoreRecord[]) private scoreHistory;

    // =========================================================================
    // Events
    // =========================================================================

    event ScoreUpdated(
        address indexed user,
        uint256 indexed score,
        uint256 txCount,
        uint256 accountAgeDays,
        uint256 timestamp
    );

    // =========================================================================
    // Errors
    // =========================================================================

    error OnlyForwarder();
    error OnlyOwner();
    error ScoreOutOfRange();
    error InvalidTimestamp();

    // =========================================================================
    // Constructor
    // =========================================================================

    constructor(address _forwarder) {
        CRE_FORWARDER = _forwarder;
        owner = msg.sender;
    }

    // =========================================================================
    // Modifiers
    // =========================================================================

    modifier onlyForwarder() {
        if (msg.sender != CRE_FORWARDER) revert OnlyForwarder();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // =========================================================================
    // CRE Workflow Entry Point
    // =========================================================================

    /**
     * @notice Called by Chainlink CRE Forwarder after WF2 consensus.
     * @param user           Stellar address (hex-encoded, or an EVM address mapping)
     * @param score          Credit score 0-1000
     * @param txCount        Number of on-chain transactions analyzed
     * @param accountAgeDays Age of the Stellar account in days
     * @param timestamp      Unix timestamp of the scoring event
     * @param metadataHash   keccak256 of full analysis JSON (stored off-chain)
     */
    function updateScore(
        address user,
        uint256 score,
        uint256 txCount,
        uint256 accountAgeDays,
        uint256 timestamp,
        bytes32 metadataHash
    ) external onlyForwarder {
        if (score > MAX_SCORE) revert ScoreOutOfRange();
        if (timestamp == 0) revert InvalidTimestamp();

        ScoreRecord memory record = ScoreRecord({
            score: score,
            txCount: txCount,
            accountAgeDays: accountAgeDays,
            timestamp: timestamp,
            metadataHash: metadataHash
        });

        latestScore[user] = record;

        ScoreRecord[] storage hist = scoreHistory[user];
        hist.push(record);

        // Trim history to MAX_HISTORY_PER_USER
        if (hist.length > MAX_HISTORY_PER_USER) {
            // Shift elements (simple approach for demo)
            for (uint256 i = 0; i < hist.length - 1; i++) {
                hist[i] = hist[i + 1];
            }
            hist.pop();
        }

        emit ScoreUpdated(user, score, txCount, accountAgeDays, timestamp);
    }

    // =========================================================================
    // Read Functions
    // =========================================================================

    function getLatestScore(address user) external view returns (ScoreRecord memory) {
        return latestScore[user];
    }

    function getScoreHistory(address user) external view returns (ScoreRecord[] memory) {
        return scoreHistory[user];
    }

    function getScoreTier(address user) external view returns (string memory) {
        uint256 score = latestScore[user].score;
        if (score >= 800) return "Excellent";
        if (score >= 600) return "Good";
        if (score >= 400) return "Fair";
        return "Poor";
    }

    function getCreditLimit(address user) external view returns (uint256) {
        uint256 score = latestScore[user].score;
        if (score >= 800) return 10_000 ether; // $10,000 equivalent
        if (score >= 600) return 5_000 ether;  // $5,000
        if (score >= 400) return 2_000 ether;  // $2,000
        return 500 ether;                       // $500
    }

    // =========================================================================
    // Admin
    // =========================================================================

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
