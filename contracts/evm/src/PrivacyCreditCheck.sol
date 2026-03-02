// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PrivacyCreditCheck
 * @notice Stores privacy-preserving credit eligibility results from CRE WF4.
 *
 * PRIVACY ARCHITECTURE:
 * - The CRE workflow uses ConfidentialHTTPClient (TEE-secured) to call
 *   an external credit bureau API.
 * - API credentials, raw credit scores, and user PII are NEVER on-chain.
 * - Only the keccak256 hash of the user identifier and a boolean eligibility
 *   flag are stored here.
 * - The user's actual credit bureau data remains encrypted inside the CRE TEE.
 *
 * This design satisfies the Chainlink Convergence Privacy track requirements:
 * - No PII on-chain
 * - No raw credit scores on-chain
 * - No API credentials on-chain
 * - Confidential HTTP via CRE Trusted Execution Environment
 *
 * Deployed on: Ethereum Sepolia Testnet
 * CRE Forwarder: 0x15fc6ae953e024d975e77382eeec56a9101f9f88
 */
contract PrivacyCreditCheck {
    // =========================================================================
    // State
    // =========================================================================

    address public immutable CRE_FORWARDER;
    address public owner;

    // Key: keccak256(user identifier) — no PII stored as plaintext
    // Value: eligibility result
    struct EligibilityResult {
        bool eligible;
        uint256 timestamp;
        uint256 expiresAt; // eligibility TTL (e.g. 30 days)
    }

    mapping(bytes32 => EligibilityResult) public results;

    uint256 public constant ELIGIBILITY_TTL = 30 days;
    uint256 public totalChecks;

    // =========================================================================
    // Events
    // =========================================================================

    /**
     * @notice Emitted when a credit check result is recorded.
     * @param userHash  keccak256 of the user identifier — no PII
     * @param eligible  Whether the user passed the credit check
     * @param timestamp Unix timestamp of the check
     */
    event EligibilityRecorded(
        bytes32 indexed userHash,
        bool eligible,
        uint256 timestamp
    );

    // =========================================================================
    // Errors
    // =========================================================================

    error OnlyForwarder();
    error OnlyOwner();
    error InvalidHash();
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
     * @notice Called by Chainlink CRE Forwarder after WF4 confidential check.
     *
     * The userHash is computed INSIDE the CRE TEE as keccak256(userId).
     * The raw userId never leaves the TEE and is never visible on-chain.
     *
     * @param userHash  keccak256 of the user identifier (e.g. Stellar address)
     * @param eligible  True if the user passed the credit eligibility check
     * @param timestamp Unix timestamp of the check
     */
    function recordEligibility(
        bytes32 userHash,
        bool eligible,
        uint256 timestamp
    ) external onlyForwarder {
        if (userHash == bytes32(0)) revert InvalidHash();
        if (timestamp == 0) revert InvalidTimestamp();

        results[userHash] = EligibilityResult({
            eligible: eligible,
            timestamp: timestamp,
            expiresAt: timestamp + ELIGIBILITY_TTL
        });

        totalChecks++;

        emit EligibilityRecorded(userHash, eligible, timestamp);
    }

    // =========================================================================
    // Read Functions
    // =========================================================================

    /**
     * @notice Check if a user hash is currently eligible (not expired).
     * @param userHash  keccak256 of the user identifier
     * @return True if eligible and result has not expired
     */
    function isEligible(bytes32 userHash) external view returns (bool) {
        EligibilityResult memory r = results[userHash];
        return r.eligible && block.timestamp <= r.expiresAt;
    }

    /**
     * @notice Get the full eligibility result for a user hash.
     * @param userHash  keccak256 of the user identifier
     */
    function getResult(bytes32 userHash) external view returns (EligibilityResult memory) {
        return results[userHash];
    }

    /**
     * @notice Helper for frontend: compute the userHash from a plaintext address string.
     * @dev  The frontend can compute this locally: keccak256(abi.encodePacked(address))
     *       This function is provided for convenience.
     */
    function computeUserHash(address user) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(user));
    }

    // =========================================================================
    // Admin
    // =========================================================================

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
