// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IBounties.sol";

contract ZKBounty is IBounties {
    mapping(bytes32 => Bounty) private bounties;
    mapping(bytes32 => uint256) private bountyIndices;
    bytes32[] private bountyIds;

    function submitBounty(uint8 bountyType, uint256 reward, string memory bountyHash) external payable {
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
    }

    function submitReport(bytes32 bountyId, string memory reportHash) external {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.submitter != address(0), "Bounty does not exist");
        require(!bounty.isApproved, "Bounty is already approved");

        Report memory newReport = Report({
            worker: msg.sender,
            reportHash: reportHash,
            isSubmitted: true
        });

        bounty.reports.push(newReport);

        emit ReportSubmitted(bountyId, msg.sender, reportHash);
    }

    function approveReport(bytes32 bountyId) external {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.submitter == msg.sender, "Not the submitter");
        require(!bounty.isApproved, "Bounty is already approved");

        bounty.isApproved = true;

        // Transfer the reward to the worker who submitted the first report
        payable(bounty.reports[0].worker).transfer(bounty.reward);

        emit ReportApproved(bountyId);
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

    function getBounty(bytes32 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }

    function getBountyIds() external view returns (bytes32[] memory) {
        return bountyIds;
    }

    function getKeyAtIndex(uint256 index) external view returns (bytes32) {
        require(index < bountyIds.length, "Index out of bounds");
        return bountyIds[index];
    }
}