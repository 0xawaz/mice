import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { formatToBytes32 } from "./utils";

describe("ZKBounty", function () {
  async function deployZKBountyFixture() {
    const [owner, issuer, hunter] = await hre.ethers.getSigners();

    const ZKBounty = await hre.ethers.getContractFactory("ZKBounty");
    const zkBounty = await ZKBounty.deploy();

    return { zkBounty, owner, issuer, hunter };
  }

  describe("Bounty Submission", function () {
    it("Should allow a user to submit a bounty", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("0.01");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      // Call the function and get the transaction object
      const tx = await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });

      const bountyId = await zkBounty.getBountyAtIndex(0);
      // Check for the emitted event
      await expect(tx)
      .to.emit(zkBounty, "BountySubmitted")
      .withArgs(bountyId, issuer.address, bountyType, reward);
    });

    it("Should deposit the reward to the contract", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("0.01");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      const contractBalanceBeforeSubmitBounty = await hre.ethers.provider.getBalance(zkBounty.getAddress());
      const issuerBalanceBeforeSubmitBounty = await hre.ethers.provider.getBalance(issuer.address);
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const contractBalanceAfterSubmitBounty = await hre.ethers.provider.getBalance(zkBounty.getAddress());
      const issuerBalanceAfterSubmitBounty = await hre.ethers.provider.getBalance(issuer.address);
      const bountyId = await zkBounty.getBountyAtIndex(0);
      const bounty = await zkBounty.getBounty(bountyId);
      expect(bounty.reward).to.equal(reward);
      expect(contractBalanceAfterSubmitBounty).to.equal(contractBalanceBeforeSubmitBounty+reward);
      expect(issuerBalanceAfterSubmitBounty).to.be.lessThan(issuerBalanceBeforeSubmitBounty);
      const bountyReward = await zkBounty.getBountyReward(bountyId)
      expect(bountyReward == reward)
    });

    it("Should not allow a bounty submission with incorrect reward value", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const incorrectReward = hre.ethers.parseEther("0.5");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));

      await expect(zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: incorrectReward }))
        .to.be.revertedWith("Reward must be equal to the sent value");
    });
  });

  describe("Hunter Registration and Report Submission", function () {
    it("Should allow a hunter to register to a bounty", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      let registerTx = await zkBounty.connect(hunter).registerToBounty(bountyId);
      await expect(registerTx)
        .to.emit(zkBounty, "HunterRegistered")
        .withArgs(bountyId, hunter.address);
    });

    it("Should update the submitted report registry", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("hash1"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      const reportHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("reportHash1"));
      await zkBounty.connect(hunter).registerToBounty(bountyId);

      const reportsInBountyBeforeSubmission = await zkBounty.getSubmittedReportsInBounty(bountyId);
      // console.log(reportsInBountyBeforeSubmission)
      expect(reportsInBountyBeforeSubmission[0] == "0x0");

      await zkBounty.connect(hunter).submitReport(bountyId, reportHash);

      const reportsInBountyAfterSubmission = await zkBounty.getSubmittedReportsInBounty(bountyId);
      expect(reportsInBountyAfterSubmission[0] == hunter.address)
    });

    it("Should update list of hunters in a bounty", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("hash1"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      const reportHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("reportHash1"));
      await zkBounty.connect(hunter).registerToBounty(bountyId);

      const huntersInBountyBeforeSubmission = await zkBounty.getHuntersInBounty(bountyId);
      // console.log(huntersInBountyBeforeSubmission)
      expect(huntersInBountyBeforeSubmission[0] == "0x0");

      await zkBounty.connect(hunter).submitReport(bountyId, reportHash);

      const huntersInBountyAfterSubmission = await zkBounty.getHuntersInBounty(bountyId);
      expect(huntersInBountyAfterSubmission[0] == hunter.address)
    });

    it("Should allow a hunter to submit a report", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("hash1"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      const reportHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("reportHash1"));
      await zkBounty.connect(hunter).registerToBounty(bountyId);

      await expect(zkBounty.connect(hunter).submitReport(bountyId, reportHash))
        .to.emit(zkBounty, "ReportSubmitted")
        .withArgs(bountyId, hunter.address, reportHash);
    });

    it("Should not allow report submission for a non-existent bounty", async function () {
      const { zkBounty, hunter } = await loadFixture(deployZKBountyFixture);
      // hardcode a random bountyId, must be in bytes format
      const bountyId = formatToBytes32("randomBountyId");
      const reportHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("reportHash1"));
      await expect(zkBounty.connect(hunter).submitReport(bountyId, reportHash))
        .to.be.revertedWith("Bounty does not exist");
    });
  });

  describe("Report Approval and Reward Transfer", function () {
    it("Should allow the submitter to finalize a report if the hash is correct and transfer the reward", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      const hunterBalanceBeforeBounty = await hre.ethers.provider.getBalance(hunter.address);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("hash2"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      const reportHash = bountyHash; // same as bountyHash to simulate correct report
      await zkBounty.connect(hunter).registerToBounty(bountyId);
      await zkBounty.connect(hunter).submitReport(bountyId, reportHash);

      await expect(zkBounty.connect(issuer).finalizeReport(bountyId, hunter, reportHash))
        .to.emit(zkBounty, "ReportApproved")
        .withArgs(bountyId);

      const hunterBalanceAfterBounty = await hre.ethers.provider.getBalance(hunter.address);
      const gasFees = 1000000000000000n;
      // console.log("hunterBalanceBeforeBounty: ", hunterBalanceBeforeBounty);
      // console.log("hunterBalanceAfterBounty:  ", hunterBalanceAfterBounty);
      expect(hunterBalanceAfterBounty).closeTo(hunterBalanceBeforeBounty+reward, gasFees);
    });

    it("Should reject a report if the hash is incorrect", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("hash3"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      const reportHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("wrongHash"));
      await zkBounty.connect(hunter).registerToBounty(bountyId);
      await zkBounty.connect(hunter).submitReport(bountyId, reportHash);

      // console.log("report hash generated from test: ", reportHash);
      // console.log("report hash from contract:       ", await zkBounty.getReportHash(bountyId, hunter.address));
      expect (await zkBounty.getReportHash(bountyId, hunter.address)).to.not.equal(bountyHash);
      await expect(zkBounty.connect(issuer).finalizeReport(bountyId, hunter, bountyHash))
      .to.emit(zkBounty, "ReportRejected")
      .withArgs(bountyId);
    });
  });

  describe("Bounty Withdrawal", function () {
    it("Should allow the submitter to withdraw an unapproved bounty", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("hash1"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      await expect(zkBounty.connect(issuer).withdrawUnapprovedBounty(bountyId))
        .to.emit(zkBounty, "BountyWithdrawn")
        .withArgs(bountyId);
    });

    it("Should not allow withdrawal of an approved bounty", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      const reportHash = bountyHash // same as bountyHash to simulate correct report
      await zkBounty.connect(hunter).registerToBounty(bountyId);
      await zkBounty.connect(hunter).submitReport(bountyId, bountyHash);
      // console.log("bountyId:                        ", bountyId);
      // console.log("report hash generated from test: ", reportHash);
      // console.log("report hash from contract:       ", await zkBounty.getReportHash(bountyId, hunter.address));
      // console.log("hunter address:                  ", hunter.address);
      expect (await zkBounty.getReportHash(bountyId, hunter.address)).to.equal(reportHash);
      const finalizeTx = await zkBounty.connect(issuer).finalizeReport(bountyId, hunter, bountyHash);
      // expect approval event to be emitted
      await expect(finalizeTx).to.emit(zkBounty, "ReportApproved").withArgs(bountyId);

      await expect(zkBounty.connect(issuer).withdrawUnapprovedBounty(bountyId))
        .to.be.revertedWith("Bounty is already approved");
    });
  });

  describe("Bounty Data", function () {
    it("Should return the correct bounty data", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("hash1"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      const bounty = await zkBounty.getBounty(bountyId);
      expect(bounty.submitter).to.equal(issuer.address);
      expect(bounty.bountyType).to.equal(bountyType);
      expect(bounty.reward).to.equal(reward);
      expect(bounty.bountyHash).to.equal(bountyHash);
      expect(bounty.isApproved).to.equal(false);
    });

    it("Should return the correct bounty IDs", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("hash1"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      const bountyIds = await zkBounty.getBountyIds();
      expect(bountyIds.length).to.equal(1);
      expect(bountyIds[0]).to.equal(bountyId);
    });
  });
});
