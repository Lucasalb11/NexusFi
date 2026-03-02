// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ReserveAttestation} from "../src/ReserveAttestation.sol";

contract ReserveAttestationTest is Test {
    ReserveAttestation public attestation;

    address public constant FORWARDER = address(0xF04d);
    address public constant OWNER = address(0xDEAD);
    address public constant RANDOM = address(0xABCD);

    function setUp() public {
        vm.prank(OWNER);
        attestation = new ReserveAttestation(FORWARDER);
    }

    function test_InitialState() public view {
        assertEq(attestation.CRE_FORWARDER(), FORWARDER);
        assertEq(attestation.owner(), OWNER);
        assertFalse(attestation.isHealthy());
    }

    function test_UpdateReserves_HealthyRatio() public {
        vm.prank(FORWARDER);
        attestation.updateReserves(
            1_250_000_00, // $1,250,000 USD cents
            1_200_000 * 1e7, // 1,200,000 nUSD
            10416, // 1.0416x ratio
            block.timestamp
        );

        ReserveAttestation.Attestation memory att = attestation.getLatest();
        assertEq(att.totalReserveUsd, 1_250_000_00);
        assertEq(att.reserveRatioBps, 10416);
        assertFalse(att.alertActive);
        assertTrue(attestation.isHealthy());
    }

    function test_UpdateReserves_AlertTriggered() public {
        vm.prank(FORWARDER);

        vm.expectEmit(true, true, false, false);
        emit ReserveAttestation.AlertTriggered(9200, block.timestamp);

        attestation.updateReserves(
            920_000_00, // $920,000 — below 95% of $1,200,000 nUSD
            1_200_000 * 1e7,
            9200, // 0.92x — below 0.95 threshold
            block.timestamp
        );

        ReserveAttestation.Attestation memory att = attestation.getLatest();
        assertTrue(att.alertActive);
    }

    function test_OnlyForwarderCanUpdate() public {
        vm.prank(RANDOM);
        vm.expectRevert(ReserveAttestation.OnlyForwarder.selector);
        attestation.updateReserves(1000, 1000, 10000, block.timestamp);
    }

    function test_HistoryTracking() public {
        vm.startPrank(FORWARDER);
        for (uint256 i = 0; i < 3; i++) {
            attestation.updateReserves(1000, 1000, 10000 + i, block.timestamp + i);
        }
        vm.stopPrank();

        assertEq(attestation.getHistoryLength(), 3);
        assertEq(attestation.getHistory(2).reserveRatioBps, 10002);
    }
}
