// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
interface IBounties {
    struct Bounty {
        address submitter;
        uint8 bountyType;
        uint256 reward;
        string bountyHash;
        string uri;
        bool isApproved;
        address[] hunters;
        // table of hunters with their reports
        mapping(address => bytes32) reports;
    }
}