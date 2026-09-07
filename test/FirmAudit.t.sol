// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/FirmAudit.sol";

contract FirmAuditTest is Test {
    FirmAudit audit;
    address agent = address(0xA11CE);
    address approver = address(0xB0B);

    function setUp() public {
        audit = new FirmAudit(agent, approver);
    }

    function testLoop() public {
        bytes32 digest = keccak256("demo-pay-50");
        vm.prank(agent);
        audit.propose(digest, address(0x1), 1e15);

        vm.prank(approver);
        audit.recordApproval(digest, 1);

        vm.prank(agent);
        audit.recordExecution(digest, bytes32(uint256(1)));

        assertTrue(audit.approved(digest));
    }
}