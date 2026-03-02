// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title RiskReport
 * @notice Receives protocol risk reports from Chainlink CRE WF3 (Risk Monitor).
 *
 * The CRE workflow monitors:
 * - Reserve ratio (nUSD reserves / total supply)
 * - Utilization rate (credit drawn / total credit capacity)
 * - Price deviation (XLM 24h volatility)
 *
 * If any metric exceeds thresholds, an alert is raised on-chain.
 * In production, this contract would integrate with the Soroban token
 * to pause minting via a cross-chain message (Axelar/CCIP).
 *
 * Deployed on: Ethereum Sepolia Testnet
 * CRE Forwarder: 0x15fc6ae953e024d975e77382eeec56a9101f9f88
 */
contract RiskReport {
    // =========================================================================
    // State
    // =========================================================================

    address public immutable CRE_FORWARDER;
    address public owner;

    // Threshold constants (in basis points, 10000 = 100%)
    uint256 public constant RESERVE_RATIO_WARNING_BPS = 9500;  // 0.95x
    uint256 public constant RESERVE_RATIO_CRITICAL_BPS = 9000; // 0.90x
    uint256 public constant UTILIZATION_WARNING_BPS = 8000;    // 80%
    uint256 public constant PRICE_DEV_WARNING_BPS = 1000;      // 10%

    struct Report {
        uint256 reserveRatioBps;    // reserve ratio * 10000
        uint256 utilizationRateBps; // utilization * 10000
        uint256 priceDeviationBps;  // 24h price change * 10000
        bool alertActive;
        uint8 severityLevel;        // 0=healthy, 1=warning, 2=critical
        uint256 timestamp;
    }

    Report public latestReport;
    uint256 public totalAlerts;
    uint256 public consecutiveAlerts;

    // =========================================================================
    // Events
    // =========================================================================

    event RiskReportUpdated(
        uint256 reserveRatioBps,
        uint256 utilizationRateBps,
        uint256 priceDeviationBps,
        bool alertActive,
        uint8 severityLevel,
        uint256 timestamp
    );

    event AlertRaised(
        uint8 severityLevel,
        uint256 reserveRatioBps,
        uint256 timestamp
    );

    event AlertCleared(uint256 timestamp);

    // =========================================================================
    // Errors
    // =========================================================================

    error OnlyForwarder();
    error OnlyOwner();
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
     * @notice Called by Chainlink CRE Forwarder after WF3 consensus.
     * @param reserveRatioBps    Reserve ratio * 10000 (10000 = 1.0x collateralized)
     * @param utilizationRateBps Utilization rate * 10000 (8000 = 80% utilized)
     * @param priceDeviationBps  24h XLM price change magnitude * 10000
     * @param alertActive        True if any threshold was breached
     * @param timestamp          Unix timestamp
     */
    function updateRisk(
        uint256 reserveRatioBps,
        uint256 utilizationRateBps,
        uint256 priceDeviationBps,
        bool alertActive,
        uint256 timestamp
    ) external onlyForwarder {
        if (timestamp == 0) revert InvalidTimestamp();

        uint8 severity = 0;
        if (alertActive) {
            if (reserveRatioBps < RESERVE_RATIO_CRITICAL_BPS) {
                severity = 2; // CRITICAL
            } else {
                severity = 1; // WARNING
            }
        }

        bool wasAlertActive = latestReport.alertActive;

        latestReport = Report({
            reserveRatioBps: reserveRatioBps,
            utilizationRateBps: utilizationRateBps,
            priceDeviationBps: priceDeviationBps,
            alertActive: alertActive,
            severityLevel: severity,
            timestamp: timestamp
        });

        if (alertActive) {
            totalAlerts++;
            consecutiveAlerts++;
            emit AlertRaised(severity, reserveRatioBps, timestamp);
        } else {
            if (wasAlertActive) {
                consecutiveAlerts = 0;
                emit AlertCleared(timestamp);
            }
        }

        emit RiskReportUpdated(
            reserveRatioBps,
            utilizationRateBps,
            priceDeviationBps,
            alertActive,
            severity,
            timestamp
        );
    }

    // =========================================================================
    // Read Functions
    // =========================================================================

    function getLatestReport() external view returns (Report memory) {
        return latestReport;
    }

    function isHealthy() external view returns (bool) {
        return !latestReport.alertActive && latestReport.timestamp > 0;
    }

    function getSeverity() external view returns (string memory) {
        if (latestReport.severityLevel == 2) return "CRITICAL";
        if (latestReport.severityLevel == 1) return "WARNING";
        return "HEALTHY";
    }

    // =========================================================================
    // Admin
    // =========================================================================

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
