// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBounties {
    struct Report {
        address worker;
        string reportHash;
        bool isSubmitted;
    }

    struct Bounty {
        address submitter;
        uint8 bountyType;
        uint256 reward;
        string bountyHash;
        bool isApproved;
        Report[] reports;
    }

    event BountySubmitted(bytes32 indexed bountyId, address indexed submitter, uint8 bountyType, uint256 reward);
    event ReportSubmitted(bytes32 indexed bountyId, address indexed worker, string reportHash);
    event ReportApproved(bytes32 indexed bountyId);
    event BountyWithdrawn(bytes32 indexed bountyId);
}