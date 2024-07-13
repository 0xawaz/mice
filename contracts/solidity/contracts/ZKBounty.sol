// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IBounties.sol";

contract ZKBounty is IBounties, ReentrancyGuard {
    mapping(bytes32 => Bounty) private bounties;
    mapping(bytes32 => uint256) private bountyIndices;
    bytes32[] private bountyIds;
    mapping(address => bool) private registeredIssuers;

    event IssuerRegistered(address indexed issuer);
    event BountySubmitted(bytes32 indexed bountyId, address indexed submitter, uint8 bountyType, uint256 reward);
    event HunterRegistered(bytes32 indexed bountyId, address indexed hunter);
    event ReportSubmitted(bytes32 indexed bountyId, address indexed worker, bytes32 reportHash);
    event ReportApproved(bytes32 indexed bountyId);
    event ReportRejected(bytes32 indexed bountyId);
    event BountyWithdrawn(bytes32 indexed bountyId);

    modifier onlyRegisteredIssuer() {
        require(registeredIssuers[msg.sender], "Not a registered issuer");
        _;
    }

    modifier onlySubmitter(bytes32 bountyId) {
        require(bounties[bountyId].submitter == msg.sender, "Not the submitter");
        _;
    }

    modifier bountyExists(bytes32 bountyId) {
        require(bounties[bountyId].submitter != address(0), "Bounty does not exist");
        _;
    }

    modifier bountyNotApproved(bytes32 bountyId) {
        require(!bounties[bountyId].isApproved, "Bounty is already approved");
        _;
    }

    function registerIssuer() external {
        require(!registeredIssuers[msg.sender], "Issuer already registered");
        registeredIssuers[msg.sender] = true;
        emit IssuerRegistered(msg.sender);
    }

    function submitBounty(uint8 bountyType, uint256 reward, string memory bountyHash) external payable onlyRegisteredIssuer returns (bytes32) {
        require(msg.value == reward, "Reward must be equal to the sent value");

        bytes32 bountyId = keccak256(abi.encodePacked(msg.sender, bountyType, bountyHash, block.number));

        Bounty storage newBounty = bounties[bountyId];
        newBounty.submitter = msg.sender;
        newBounty.bountyType = bountyType;
        newBounty.reward = reward;
        newBounty.bountyHash = bountyHash;
        newBounty.isApproved = false;

        bountyIndices[bountyId] = bountyIds.length;
        bountyIds.push(bountyId);

        emit BountySubmitted(bountyId, msg.sender, bountyType, reward);
        return bountyId;
    }

    function registerToBounty(bytes32 bountyId) external bountyExists(bountyId) bountyNotApproved(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.submitter != msg.sender, "Submitter cannot register");
        
        bounty.hunters.push(msg.sender);

        emit HunterRegistered(bountyId, msg.sender);
    }

    function submitReport(bytes32 bountyId, bytes32 reportHash) external bountyExists(bountyId) bountyNotApproved(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        bounty.reports[msg.sender] = reportHash;

        emit ReportSubmitted(bountyId, msg.sender, reportHash);
    }

    function finalizeReport(bytes32 bountyId, address payable hunter, bytes32 hash) 
        external 
        payable 
        bountyExists(bountyId)  // Move this before onlySubmitter
        onlySubmitter(bountyId) 
        bountyNotApproved(bountyId) 
        nonReentrant 
    {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.reports[hunter] != "", "No report submitted");

        bytes32 reportHash = getReportHash(bountyId, hunter);
        uint256 reward = bounty.reward;
        
        if (reportHash == hash) {
            // Update state before transfer
            bounty.isApproved = true;
            
            // Remove bounty from the list
            uint256 index = bountyIndices[bountyId];
            bountyIds[index] = bountyIds[bountyIds.length - 1];
            bountyIds.pop();
            delete bountyIndices[bountyId];
            
            // Emit event before transfer
            emit ReportApproved(bountyId);
            
            // Transfer the reward after state changes and event emission
            payable(hunter).transfer(reward);
        } else {
            delete bounty.hunters;
            emit ReportRejected(bountyId);
        }
    }

    function withdrawUnapprovedBounty(bytes32 bountyId) external onlySubmitter(bountyId) bountyExists(bountyId) bountyNotApproved(bountyId) nonReentrant {
        Bounty storage bounty = bounties[bountyId];
        uint256 reward = bounty.reward;
        
        // Clear bounty fields
        bounty.submitter = address(0);
        bounty.bountyType = 0;
        bounty.reward = 0;
        bounty.bountyHash = "";
        bounty.isApproved = false;
        delete bounty.hunters;
        // Note: We can't delete the reports mapping, but it will be inaccessible

        // Remove bountyId from the list
        uint256 index = bountyIndices[bountyId];
        bountyIds[index] = bountyIds[bountyIds.length - 1];
        bountyIds.pop();
        delete bountyIndices[bountyId];

        // Emit event before transfer
        emit BountyWithdrawn(bountyId);

        // Refund the submitter after state changes
        payable(msg.sender).transfer(reward);
    }

    function getBounty(bytes32 bountyId) external view bountyExists(bountyId) returns (address submitter, uint8 bountyType, uint256 reward, string memory bountyHash, string memory uri, bool isApproved) {
        Bounty storage bounty = bounties[bountyId];
        return (bounty.submitter, bounty.bountyType, bounty.reward, bounty.bountyHash, bounty.uri, bounty.isApproved);
    }

    function getBountyReward(bytes32 bountyId) external view bountyExists(bountyId) returns (uint256 amount) {
        Bounty storage bounty = bounties[bountyId];
        return (bounty.reward);
    }

    function getBountyIds() external view returns (bytes32[] memory) {
        return bountyIds;
    }

    function getBountyAtIndex(uint256 index) public view returns (bytes32) {
        require(index < bountyIds.length, "Index out of bounds");
        return bountyIds[index];
    }

    function getReportHash(bytes32 bountyId, address hunter) public view bountyExists(bountyId) returns (bytes32) {
        Bounty storage bounty = bounties[bountyId];
        return bounty.reports[hunter];
    }

    function getHuntersInBounty(bytes32 bountyId) external view bountyExists(bountyId) returns (address[] memory) {
        Bounty storage bounty = bounties[bountyId];
        return bounty.hunters;
    }

    function getSubmittedReportsInBounty(bytes32 bountyId) external view bountyExists(bountyId) bountyNotApproved(bountyId) returns (bytes32[] memory) {
        Bounty storage bounty = bounties[bountyId];
        bytes32[] memory reportHashes = new bytes32[](bounty.hunters.length);
        for (uint256 i = 0; i < bounty.hunters.length; i++) {
            address hunter = bounty.hunters[i];
            reportHashes[i] = bounty.reports[hunter];
        }
        return reportHashes;
    }

    function isRegisteredIssuer(address issuer) external view returns (bool) {
        return registeredIssuers[issuer];
    }
}