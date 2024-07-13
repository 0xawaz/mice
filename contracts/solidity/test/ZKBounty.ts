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

  describe("Issuer Registration", function () {
    it("Should allow an issuer to register", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      await expect(zkBounty.connect(issuer).registerIssuer())
        .to.emit(zkBounty, "IssuerRegistered")
        .withArgs(issuer.address);
    });

    it("Should not allow an issuer to register twice", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      await expect(zkBounty.connect(issuer).registerIssuer())
        .to.be.revertedWith("Issuer already registered");
    });

    it("Should not allow a non-registered issuer to submit a bounty", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      
      await expect(zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward }))
        .to.be.revertedWith("Not a registered issuer");
    });
  });

  describe("Bounty Submission", function () {
    it("Should allow a registered issuer to submit a bounty", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("0.01");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      const tx = await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });

      const bountyId = await zkBounty.getBountyAtIndex(0);
      await expect(tx)
        .to.emit(zkBounty, "BountySubmitted")
        .withArgs(bountyId, issuer.address, bountyType, reward);
    });

    it("Should not allow an unregistered issuer to submit a bounty", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      const bountyType = 1;
      const reward = hre.ethers.parseEther("0.01");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      await expect(zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward }))
        .to.be.revertedWith("Not a registered issuer");
    });

    it("Should deposit the reward to the contract", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
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
      expect(contractBalanceAfterSubmitBounty).to.equal(contractBalanceBeforeSubmitBounty + reward);
      expect(issuerBalanceAfterSubmitBounty).to.be.lessThan(issuerBalanceBeforeSubmitBounty);
      const bountyReward = await zkBounty.getBountyReward(bountyId);
      expect(bountyReward).to.equal(reward);
    });

    it("Should not allow a bounty submission with incorrect reward value", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
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
      await zkBounty.connect(issuer).registerIssuer();
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

    it("Should not allow submitter to register for their own bounty", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      await expect(zkBounty.connect(issuer).registerToBounty(bountyId))
        .to.be.revertedWith("Submitter cannot register");
    });

    it("Should update the submitted report registry", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("hash1"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      const reportHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("reportHash1"));
      await zkBounty.connect(hunter).registerToBounty(bountyId);

      const reportsInBountyBeforeSubmission = await zkBounty.getSubmittedReportsInBounty(bountyId);
      expect(reportsInBountyBeforeSubmission[0]).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");

      await zkBounty.connect(hunter).submitReport(bountyId, reportHash);

      const reportsInBountyAfterSubmission = await zkBounty.getSubmittedReportsInBounty(bountyId);
      expect(reportsInBountyAfterSubmission[0]).to.equal(reportHash);
    });

    it("Should update list of hunters in a bounty", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("hash1"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      await zkBounty.connect(hunter).registerToBounty(bountyId);

      const huntersInBounty = await zkBounty.getHuntersInBounty(bountyId);
      expect(huntersInBounty[0]).to.equal(hunter.address);
    });

    it("Should allow a hunter to submit a report", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
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
      const bountyId = formatToBytes32("randomBountyId");
      const reportHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("reportHash1"));
      await expect(zkBounty.connect(hunter).submitReport(bountyId, reportHash))
        .to.be.revertedWith("Bounty does not exist");
    });

  });

  describe("Report Approval and Reward Transfer", function () {
    it("Should allow the submitter to finalize a report if the hash is correct and transfer the reward", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
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
      expect(hunterBalanceAfterBounty).to.be.closeTo(hunterBalanceBeforeBounty + reward, gasFees);
    });

    it("Should reject a report if the hash is incorrect", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("hash3"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      const reportHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("wrongHash"));
      await zkBounty.connect(hunter).registerToBounty(bountyId);
      await zkBounty.connect(hunter).submitReport(bountyId, reportHash);

      expect(await zkBounty.getReportHash(bountyId, hunter.address)).to.not.equal(bountyHash);
      await expect(zkBounty.connect(issuer).finalizeReport(bountyId, hunter, bountyHash))
        .to.emit(zkBounty, "ReportRejected")
        .withArgs(bountyId);
    });

    it("Should not allow non-submitter to finalize a report", async function () {
      const { zkBounty, issuer, hunter, owner } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      await zkBounty.connect(hunter).registerToBounty(bountyId);
      await zkBounty.connect(hunter).submitReport(bountyId, bountyHash);

      await expect(zkBounty.connect(owner).finalizeReport(bountyId, hunter, bountyHash))
        .to.be.revertedWith("Not the submitter");
    });

    it("Should not allow finalizing a report for a non-existent bounty", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      const nonExistentBountyId = formatToBytes32("nonExistentBountyId");
      const reportHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("reportHash"));
    
      await expect(zkBounty.connect(issuer).finalizeReport(nonExistentBountyId, hunter.address, reportHash))
        .to.be.revertedWith("Bounty does not exist");
    });

    it("Should not allow finalizing a report for an already approved bounty", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      await zkBounty.connect(hunter).registerToBounty(bountyId);
      await zkBounty.connect(hunter).submitReport(bountyId, bountyHash);
      await zkBounty.connect(issuer).finalizeReport(bountyId, hunter, bountyHash);

      await expect(zkBounty.connect(issuer).finalizeReport(bountyId, hunter, bountyHash))
        .to.be.revertedWith("Bounty is already approved");
    });

    it("Should not allow withdrawing an already withdrawn bounty", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);
    
      await zkBounty.connect(issuer).withdrawUnapprovedBounty(bountyId);
      
      await expect(zkBounty.connect(issuer).withdrawUnapprovedBounty(bountyId))
        .to.be.revertedWith("Not the submitter");
    });

    it("Should not allow finalizing a report for an already approved bounty", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);
    
      await zkBounty.connect(hunter).registerToBounty(bountyId);
      await zkBounty.connect(hunter).submitReport(bountyId, bountyHash);
      await zkBounty.connect(issuer).finalizeReport(bountyId, hunter.address, bountyHash);
    
      await expect(zkBounty.connect(issuer).finalizeReport(bountyId, hunter.address, bountyHash))
        .to.be.revertedWith("Bounty is already approved");
    });
  });

  describe("Bounty Withdrawal", function () {
    it("Should allow the submitter to withdraw an unapproved bounty", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
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
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      const reportHash = bountyHash; // same as bountyHash to simulate correct report
      await zkBounty.connect(hunter).registerToBounty(bountyId);
      await zkBounty.connect(hunter).submitReport(bountyId, bountyHash);
      expect(await zkBounty.getReportHash(bountyId, hunter.address)).to.equal(reportHash);
      const finalizeTx = await zkBounty.connect(issuer).finalizeReport(bountyId, hunter, bountyHash);
      await expect(finalizeTx).to.emit(zkBounty, "ReportApproved").withArgs(bountyId);

      await expect(zkBounty.connect(issuer).withdrawUnapprovedBounty(bountyId))
        .to.be.revertedWith("Bounty is already approved");
    });

    it("Should not allow non-submitter to withdraw a bounty", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      await expect(zkBounty.connect(hunter).withdrawUnapprovedBounty(bountyId))
        .to.be.revertedWith("Not the submitter");
    });
  });

  describe("Bounty Data", function () {
    it("Should return the correct bounty data", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
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
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("hash1"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      const bountyIds = await zkBounty.getBountyIds();
      expect(bountyIds.length).to.equal(1);
      expect(bountyIds[0]).to.equal(bountyId);
    });

    it("Should revert when trying to get a bounty at an out-of-bounds index", async function () {
      const { zkBounty } = await loadFixture(deployZKBountyFixture);
      await expect(zkBounty.getBountyAtIndex(0)).to.be.revertedWith("Index out of bounds");
    });

    it("Should revert when trying to get a report hash for a non-existent bounty", async function () {
      const { zkBounty, hunter } = await loadFixture(deployZKBountyFixture);
      const nonExistentBountyId = formatToBytes32("nonExistentBountyId");
      await expect(zkBounty.getReportHash(nonExistentBountyId, hunter.address))
        .to.be.revertedWith("Bounty does not exist");
    });
  });

  describe("Issuer Verification", function () {
    it("Should correctly identify registered and unregistered issuers", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();

      expect(await zkBounty.isRegisteredIssuer(issuer.address)).to.be.true;
      expect(await zkBounty.isRegisteredIssuer(hunter.address)).to.be.false;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple hunters registering and submitting reports", async function () {
      const { zkBounty, issuer, hunter, owner } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);

      await zkBounty.connect(hunter).registerToBounty(bountyId);
      await zkBounty.connect(owner).registerToBounty(bountyId);

      const reportHash1 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("reportHash1"));
      const reportHash2 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("reportHash2"));

      await zkBounty.connect(hunter).submitReport(bountyId, reportHash1);
      await zkBounty.connect(owner).submitReport(bountyId, reportHash2);

      const hunters = await zkBounty.getHuntersInBounty(bountyId);
      expect(hunters.length).to.equal(2);
      expect(hunters).to.include(hunter.address);
      expect(hunters).to.include(owner.address);

      const reports = await zkBounty.getSubmittedReportsInBounty(bountyId);
      expect(reports.length).to.equal(2);
      expect(reports).to.include(reportHash1);
      expect(reports).to.include(reportHash2);
    });

    it("Should handle submitting multiple bounties", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash1 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash1"));
      const bountyHash2 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash2"));

      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash1, { value: reward });
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash2, { value: reward });

      const bountyIds = await zkBounty.getBountyIds();
      expect(bountyIds.length).to.equal(2);

      const bounty1 = await zkBounty.getBounty(bountyIds[0]);
      const bounty2 = await zkBounty.getBounty(bountyIds[1]);

      expect(bounty1.bountyHash).to.equal(bountyHash1);
      expect(bounty2.bountyHash).to.equal(bountyHash2);
    });
  
    it("Should not allow registering to a non-existent bounty", async function () {
      const { zkBounty, hunter } = await loadFixture(deployZKBountyFixture);
      const nonExistentBountyId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("nonExistentBounty"));
      
      await expect(zkBounty.connect(hunter).registerToBounty(nonExistentBountyId))
        .to.be.revertedWith("Bounty does not exist");
    });
  
    it("Should not allow submitting a report for a non-existent bounty", async function () {
      const { zkBounty, hunter } = await loadFixture(deployZKBountyFixture);
      const nonExistentBountyId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("nonExistentBounty"));
      const reportHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("reportHash"));
      
      await expect(zkBounty.connect(hunter).submitReport(nonExistentBountyId, reportHash))
        .to.be.revertedWith("Bounty does not exist");
    });
  
    it("Should not allow finalizing a report for a hunter that hasn't submitted", async function () {
      const { zkBounty, issuer, hunter } = await loadFixture(deployZKBountyFixture);
      await zkBounty.connect(issuer).registerIssuer();
      const bountyType = 1;
      const reward = hre.ethers.parseEther("1.0");
      const bountyHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("bountyHash"));
      await zkBounty.connect(issuer).submitBounty(bountyType, reward, bountyHash, { value: reward });
      const bountyId = await zkBounty.getBountyAtIndex(0);
  
      await zkBounty.connect(hunter).registerToBounty(bountyId);
      // Note: Hunter doesn't submit a report
  
      await expect(zkBounty.connect(issuer).finalizeReport(bountyId, hunter.address, bountyHash))
        .to.be.revertedWith("No report submitted");
    });
  
    it("Should not allow withdrawing a non-existent bounty", async function () {
      const { zkBounty, issuer } = await loadFixture(deployZKBountyFixture);
      const nonExistentBountyId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("nonExistentBounty"));
      
      await expect(zkBounty.connect(issuer).withdrawUnapprovedBounty(nonExistentBountyId))
        .to.be.revertedWith("Not the submitter");
    });
  });
});