// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ReserveAttestation} from "../src/ReserveAttestation.sol";
import {CreditScoreAttestation} from "../src/CreditScoreAttestation.sol";
import {RiskReport} from "../src/RiskReport.sol";
import {PrivacyCreditCheck} from "../src/PrivacyCreditCheck.sol";

/**
 * @title Deploy
 * @notice Deploys all NexusFi attestation contracts to Sepolia.
 *
 * Run with:
 *   forge script script/Deploy.s.sol \
 *     --rpc-url $SEPOLIA_RPC_URL \
 *     --private-key $DEPLOYER_PRIVATE_KEY \
 *     --broadcast \
 *     --verify
 *
 * CRE Forwarder on Sepolia: 0x15fc6ae953e024d975e77382eeec56a9101f9f88
 */
contract Deploy is Script {
    // Chainlink CRE Forwarder address on Ethereum Sepolia
    address constant CRE_FORWARDER = 0x15fc6ae953e024d975e77382eeec56a9101f9f88;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        ReserveAttestation reserveAttestation = new ReserveAttestation(CRE_FORWARDER);
        console.log("ReserveAttestation:", address(reserveAttestation));

        CreditScoreAttestation creditScoreAttestation = new CreditScoreAttestation(CRE_FORWARDER);
        console.log("CreditScoreAttestation:", address(creditScoreAttestation));

        RiskReport riskReport = new RiskReport(CRE_FORWARDER);
        console.log("RiskReport:", address(riskReport));

        PrivacyCreditCheck privacyCreditCheck = new PrivacyCreditCheck(CRE_FORWARDER);
        console.log("PrivacyCreditCheck:", address(privacyCreditCheck));

        vm.stopBroadcast();

        console.log("\n=== NexusFi EVM Contracts Deployed ===");
        console.log("Network: Ethereum Sepolia Testnet");
        console.log("CRE Forwarder:", CRE_FORWARDER);
        console.log("ReserveAttestation:", address(reserveAttestation));
        console.log("CreditScoreAttestation:", address(creditScoreAttestation));
        console.log("RiskReport:", address(riskReport));
        console.log("PrivacyCreditCheck:", address(privacyCreditCheck));
        console.log("\nAdd these to your .env file:");
        console.log("RESERVE_ATTESTATION_CONTRACT=", address(reserveAttestation));
        console.log("CREDIT_SCORE_ATTESTATION_CONTRACT=", address(creditScoreAttestation));
        console.log("RISK_REPORT_CONTRACT=", address(riskReport));
        console.log("PRIVACY_CREDIT_CHECK_CONTRACT=", address(privacyCreditCheck));
    }
}
