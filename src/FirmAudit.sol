// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FirmAudit {
    address public owner;

    mapping(address => bool) public isAgent;
    mapping(address => bool) public isApprover;
    mapping(bytes32 => bool) public proposed;
    mapping(bytes32 => bool) public approved;

    event DecisionProposed(address indexed agent, bytes32 indexed digest, address target, uint256 amount);
    event ApprovalRecorded(address indexed approver, bytes32 indexed digest, uint8 decision);
    event ActionExecuted(address indexed agent, bytes32 indexed digest, bytes32 txHash);

    error NotOwner();
    error NotAgent();
    error NotApprover();
    error AlreadyProposed();
    error NotProposed();
    error NotApproved();
    error AlreadyApproved();

    constructor(address firstAgent, address firstApprover) {
        owner = msg.sender;
        isAgent[firstAgent] = true;
        isApprover[firstApprover] = true;
    }

    function propose(bytes32 digest, address target, uint256 amount) external {
        if (!isAgent[msg.sender]) revert NotAgent();
        if (proposed[digest] || approved[digest]) revert AlreadyProposed();
        proposed[digest] = true;
        emit DecisionProposed(msg.sender, digest, target, amount);
    }

    function recordApproval(bytes32 digest, uint8 decision) external {
        if (!isApprover[msg.sender]) revert NotApprover();
        if (!proposed[digest]) revert NotProposed();
        if (approved[digest]) revert AlreadyApproved();
        if (decision == 1) {
            approved[digest] = true;
        } else {
            proposed[digest] = false;
        }
        emit ApprovalRecorded(msg.sender, digest, decision);
    }

    function recordExecution(bytes32 digest, bytes32 txHash) external {
        if (!isAgent[msg.sender]) revert NotAgent();
        if (!approved[digest]) revert NotApproved();
        emit ActionExecuted(msg.sender, digest, txHash);
    }
}