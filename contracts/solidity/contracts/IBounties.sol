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
}