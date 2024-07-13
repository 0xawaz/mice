import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { formatToBytes32 } from "./utils";

describe("ZKBounty", function () {
  async function deployZKBountyFixture() {
    const [owner, addr1, addr2] = await hre.ethers.getSigners();

    const ZKBounty = await hre.ethers.getContractFactory("ZKBounty");
    const zkBounty = await ZKBounty.deploy();

    return { zkBounty, owner, addr1, addr2 };
  }

  describe("Bounty Submission", function () {
    it("Should allow a user to submit a bounty", async function () {
      const { zkBounty, addr1 } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("0.01");
      const bountyHash = "hash1";
      // Call the function and get the transaction object
      const tx = await zkBounty.connect(addr1).submitBounty(bountyType, reward, bountyHash, { value: reward });

      const bountyId = await zkBounty.getKeyAtIndex(0);
      // Check for the emitted event
      await expect(tx)
      .to.emit(zkBounty, "BountySubmitted")
      .withArgs(bountyId, addr1.address, bountyType, reward);
    });

    it("Should deposit the reward to the contract", async function () {
      const { zkBounty, addr1 } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("0.01");
      const bountyHash = "hash1";
      const contractBalanceBeforeSubmitBounty = await hre.ethers.provider.getBalance(zkBounty.getAddress());
      const addr1BalanceBeforeSubmitBounty = await hre.ethers.provider.getBalance(addr1.address);
      await zkBounty.connect(addr1).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const contractBalanceAfterSubmitBounty = await hre.ethers.provider.getBalance(zkBounty.getAddress());
      const addr1BalanceAfterSubmitBounty = await hre.ethers.provider.getBalance(addr1.address);
      const bountyId = await zkBounty.getKeyAtIndex(0);
      const bounty = await zkBounty.getBounty(bountyId);
      expect(bounty.reward).to.equal(reward);
      expect(contractBalanceAfterSubmitBounty).to.equal(contractBalanceBeforeSubmitBounty+reward);
      expect(addr1BalanceAfterSubmitBounty).to.be.lessThan(addr1BalanceBeforeSubmitBounty);
    });

    it("Should not allow a bounty submission with incorrect reward value", async function () {
      const { zkBounty, addr1 } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const incorrectReward = hre.ethers.parseEther("0.5");
      const bountyHash = "hash1";

      await expect(zkBounty.connect(addr1).submitBounty(bountyType, reward, bountyHash, { value: incorrectReward }))
        .to.be.revertedWith("Reward must be equal to the sent value");
    });
  });

  describe("Report Submission", function () {
    it("Should allow a worker to submit a report", async function () {
      const { zkBounty, addr1, addr2 } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = "hash1";
      await zkBounty.connect(addr1).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getKeyAtIndex(0);

      const reportHash = "reportHash1";
      await expect(zkBounty.connect(addr2).submitReport(bountyId, reportHash))
        .to.emit(zkBounty, "ReportSubmitted")
        .withArgs(bountyId, addr2.address, reportHash);
    });

    it("Should not allow report submission for a non-existent bounty", async function () {
      const { zkBounty, addr2 } = await loadFixture(deployZKBountyFixture);
      // hardcode a random bountyId, must be in bytes format
      const bountyId = formatToBytes32("randomBountyId");
      const reportHash = "reportHash1";
      await expect(zkBounty.connect(addr2).submitReport(bountyId, reportHash))
        .to.be.revertedWith("Bounty does not exist");
    });
  });

  describe("Report Approval and Reward Transfer", function () {
    it("Should allow the submitter to approve a report and transfer the reward", async function () {
      const { zkBounty, addr1, addr2 } = await loadFixture(deployZKBountyFixture);
      const addr2BalanceBeforeBounty = await hre.ethers.provider.getBalance(addr2.address);
      // console.log("addr2BalanceBeforeBounty", addr2BalanceBeforeBounty);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = "hash1";
      await zkBounty.connect(addr1).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getKeyAtIndex(0);

      const reportHash = "reportHash1";
      await zkBounty.connect(addr2).submitReport(bountyId, reportHash);

      await expect(zkBounty.connect(addr1).approveReport(bountyId))
        .to.emit(zkBounty, "ReportApproved")
        .withArgs(bountyId);

      const addr2BalanceAfterBounty = await hre.ethers.provider.getBalance(addr2.address);
      // console.log("addr2BalanceAfterBounty", addr2Balance);
      // console.log("reward", reward);
      const gasFees = 1000000000000000
      expect(addr2BalanceAfterBounty).closeTo(addr2BalanceBeforeBounty+reward, gasFees);
    });
  });

  describe("Bounty Withdrawal", function () {
    it("Should allow the submitter to withdraw an unapproved bounty", async function () {
      const { zkBounty, addr1 } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = "hash1";
      await zkBounty.connect(addr1).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getKeyAtIndex(0);

      await expect(zkBounty.connect(addr1).withdrawUnapprovedBounty(bountyId))
        .to.emit(zkBounty, "BountyWithdrawn")
        .withArgs(bountyId);

      const bounty = await zkBounty.getBounty(bountyId);
      expect(bounty.submitter).to.equal(hre.ethers.ZeroAddress);
    });

    it("Should not allow withdrawal of an approved bounty", async function () {
      const { zkBounty, addr1, addr2 } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = "hash1";
      await zkBounty.connect(addr1).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getKeyAtIndex(0);

      const reportHash = "reportHash1";
      await zkBounty.connect(addr2).submitReport(bountyId, reportHash);
      await zkBounty.connect(addr1).approveReport(bountyId);

      await expect(zkBounty.connect(addr1).withdrawUnapprovedBounty(bountyId))
        .to.be.revertedWith("Bounty is already approved");
    });
  });

  describe("Bounty Data", function () {
    it("Should return the correct bounty data", async function () {
      const { zkBounty, addr1 } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = "hash1";
      await zkBounty.connect(addr1).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getKeyAtIndex(0);

      const bounty = await zkBounty.getBounty(bountyId);
      expect(bounty.submitter).to.equal(addr1.address);
      expect(bounty.bountyType).to.equal(bountyType);
      expect(bounty.reward).to.equal(reward);
      expect(bounty.bountyHash).to.equal(bountyHash);
      expect(bounty.isApproved).to.equal(false);
    });

    it("Should return the correct bounty IDs", async function () {
      const { zkBounty, addr1 } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = "hash1";
      await zkBounty.connect(addr1).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getKeyAtIndex(0);

      const bountyIds = await zkBounty.getBountyIds();
      expect(bountyIds.length).to.equal(1);
      expect(bountyIds[0]).to.equal(bountyId);
    });
  });
});