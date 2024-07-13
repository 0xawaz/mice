// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IBounties.sol";

contract ZKBounty is IBounties {
    mapping(bytes32 => Bounty) private bounties;
    mapping(bytes32 => uint256) private bountyIndices;
    bytes32[] private bountyIds;

    event BountySubmitted(bytes32 indexed bountyId, address indexed submitter, uint8 bountyType, uint256 reward);
    event HunterRegistered(bytes32 indexed bountyId, address indexed hunter);
    event ReportSubmitted(bytes32 indexed bountyId, address indexed worker, bytes32 reportHash);
    event ReportApproved(bytes32 indexed bountyId);
    event ReportRejected(bytes32 indexed bountyId);
    event BountyWithdrawn(bytes32 indexed bountyId);

    function submitBounty(uint8 bountyType, uint256 reward, string memory bountyHash) external payable returns (bytes32) {
        require(msg.value == reward, "Reward must be equal to the sent value");

        bytes32 bountyId = keccak256(abi.encodePacked(msg.sender, bountyType, bountyHash, block.timestamp));
        require(bounties[bountyId].submitter == address(0), "Bounty already exists");

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

    function registerToBounty(bytes32 bountyId) external {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.submitter != address(0), "Bounty does not exist");
        require(!bounty.isApproved, "Bounty is already approved");
        require(bounty.submitter != msg.sender, "Submitter cannot register");
        
        bounty.hunters.push(msg.sender);

        emit HunterRegistered(bountyId, msg.sender);
    }

    function submitReport(bytes32 bountyId, bytes32 reportHash) external {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.submitter != address(0), "Bounty does not exist");
        require(!bounty.isApproved, "Bounty is already approved");

        // Push report hash for the sender
        bounty.reports[msg.sender] = reportHash;

        emit ReportSubmitted(bountyId, msg.sender, reportHash);
    }

    // Finalize report
    function finalizeReport(bytes32 bountyId, address payable hunter, bytes32 _hash) external payable {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.submitter == msg.sender, "Not the submitter");
        require(!bounty.isApproved, "Bounty is already approved");
        require(bounty.reports[hunter] != "", "No report submitted");

        bytes32 reportHash = getReportHash(bountyId, hunter);
        if (reportHash == _hash) {
            approveReport(bountyId);
            // Transfer the reward to the worker who submitted the report
            payable(hunter).transfer(bounty.reward);
            emit ReportApproved(bountyId);
        } else {
            rejectReport(bountyId);
            emit ReportRejected(bountyId);
        }

        // Remove bounty from the list
        uint256 index = bountyIndices[bountyId];
        bountyIds[index] = bountyIds[bountyIds.length - 1];
        bountyIds.pop();
        delete bountyIndices[bountyId];
    }

    // Helper function to approve and send prize to the signer in case hash is correct
    function approveReport(bytes32 bountyId) internal {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.submitter == msg.sender, "Not the submitter");
        require(!bounty.isApproved, "Bounty is already approved");

        bounty.isApproved = true;
    }

    // Helper function to reject the report
    function rejectReport(bytes32 bountyId) internal {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.submitter == msg.sender, "Not the submitter");
        require(!bounty.isApproved, "Bounty is already approved");

        delete bounty.hunters;
    }

    function withdrawUnapprovedBounty(bytes32 bountyId) external {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.submitter == msg.sender, "Not the submitter");
        require(!bounty.isApproved, "Bounty is already approved");

        uint256 reward = bounty.reward;
        delete bounties[bountyId];

        // Remove bountyId from the list
        uint256 index = bountyIndices[bountyId];
        bountyIds[index] = bountyIds[bountyIds.length - 1];
        bountyIds.pop();
        delete bountyIndices[bountyId];

        // Refund the submitter
        payable(msg.sender).transfer(reward);

        emit BountyWithdrawn(bountyId);
    }

    function getBounty(bytes32 bountyId) external view returns (address submitter, uint8 bountyType, uint256 reward, string memory bountyHash, string memory uri, bool isApproved) {
        Bounty storage bounty = bounties[bountyId];
        return (bounty.submitter, bounty.bountyType, bounty.reward, bounty.bountyHash, bounty.uri, bounty.isApproved);
    }

    function getBountyReward(bytes32 bountyId) external view returns (uint256 amount) {
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

    function getReportHash(bytes32 bountyId, address hunter) public view returns (bytes32) {
        Bounty storage bounty = bounties[bountyId];
        return bounty.reports[hunter];
    }

    function getHuntersInBounty(bytes32 bountyId) external view returns (address[] memory) {
        Bounty storage bounty = bounties[bountyId];
        return bounty.hunters;
    }

    // New function to get all report hashes for a given bountyId
    function getSubmittedReportsInBounty(bytes32 bountyId) external view returns (bytes32[] memory) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.submitter != address(0), "Bounty does not exist");
        require(!bounty.isApproved, "Bounty is already approved");

        bytes32[] memory reportHashes = new bytes32[](bounty.hunters.length);
        for (uint256 i = 0; i < bounty.hunters.length; i++) {
            address hunter = bounty.hunters[i];
            reportHashes[i] = bounty.reports[hunter];
        }
        return reportHashes;
    }
}
