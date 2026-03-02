// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ReserveAttestation
 * @notice Receives Proof of Reserve attestations from Chainlink CRE WF1.
 *
 * Only the Chainlink CRE Forwarder contract can call `updateReserves()`.
 * The Forwarder verifies the DON signature before forwarding the report.
 *
 * Deployed on: Ethereum Sepolia Testnet
 * CRE Forwarder: 0x15fc6ae953e024d975e77382eeec56a9101f9f88
 */
contract ReserveAttestation {
    // =========================================================================
    // State
    // =========================================================================

    address public immutable CRE_FORWARDER;
    address public owner;

    struct Attestation {
        uint256 totalReserveUsd;   // in USD cents (multiply by 0.01 for display)
        uint256 totalMintedNusd;   // in smallest units (7 decimals)
        uint256 reserveRatioBps;   // ratio * 10000 (e.g. 10250 = 1.025x)
        uint256 timestamp;
        bool alertActive;          // true if ratio < 9500 (< 0.95x)
    }

    Attestation public latest;
    Attestation[] public history;
    uint256 public constant MAX_HISTORY = 50;

    // =========================================================================
    // Events
    // =========================================================================

    event ReserveUpdated(
        uint256 indexed totalReserveUsd,
        uint256 indexed totalMintedNusd,
        uint256 reserveRatioBps,
        uint256 timestamp,
        bool alertActive
    );

    event AlertTriggered(
        uint256 reserveRatioBps,
        uint256 timestamp
    );

    // =========================================================================
    // Errors
    // =========================================================================

    error OnlyForwarder();
    error OnlyOwner();
    error InvalidData();

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
     * @notice Called by Chainlink CRE Forwarder after DON consensus on WF1.
     * @param totalReserveUsd  Reserve value in USD cents
     * @param totalMintedNusd  nUSD total supply in 7-decimal units
     * @param reserveRatioBps  Reserve ratio * 10000 (10000 = 1.0x, 10250 = 1.025x)
     * @param timestamp        Unix timestamp of the attestation
     */
    function updateReserves(
        uint256 totalReserveUsd,
        uint256 totalMintedNusd,
        uint256 reserveRatioBps,
        uint256 timestamp
    ) external onlyForwarder {
        if (timestamp == 0) revert InvalidData();

        bool alertActive = reserveRatioBps < 9500; // below 0.95x

        Attestation memory att = Attestation({
            totalReserveUsd: totalReserveUsd,
            totalMintedNusd: totalMintedNusd,
            reserveRatioBps: reserveRatioBps,
            timestamp: timestamp,
            alertActive: alertActive
        });

        latest = att;

        // Ring buffer for history
        if (history.length < MAX_HISTORY) {
            history.push(att);
        } else {
            // Shift and overwrite oldest (simple approach — gas intensive for large arrays)
            // Production: use a circular buffer index
            for (uint256 i = 0; i < history.length - 1; i++) {
                history[i] = history[i + 1];
            }
            history[history.length - 1] = att;
        }

        emit ReserveUpdated(
            totalReserveUsd,
            totalMintedNusd,
            reserveRatioBps,
            timestamp,
            alertActive
        );

        if (alertActive) {
            emit AlertTriggered(reserveRatioBps, timestamp);
        }
    }

    // =========================================================================
    // Read Functions
    // =========================================================================

    function getLatest() external view returns (Attestation memory) {
        return latest;
    }

    function getHistoryLength() external view returns (uint256) {
        return history.length;
    }

    function getHistory(uint256 index) external view returns (Attestation memory) {
        return history[index];
    }

    function isHealthy() external view returns (bool) {
        return !latest.alertActive && latest.timestamp > 0;
    }

    // =========================================================================
    // Admin
    // =========================================================================

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
