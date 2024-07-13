import { ethers } from 'ethers';
import { artifacts } from "hardhat";

// Declare the ethereum property on the window object
declare global {
  interface Window {
    ethereum?: ethers.providers.ExternalProvider;
  }
}

// Contract details
const contractName = "ZKBounty";
const contractAddress = '0x1085CC7f389d2ee9D20F4cd4b06984aC1Aa00bdF';

// Linea network details
const LINEA_TESTNET_RPC_URL = "https://rpc.goerli.linea.build";
const LINEA_TESTNET_CHAIN_ID = 59140;

// Function to get provider
function getProvider(): ethers.providers.Provider {
  if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    // We are in the browser and MetaMask is running
    return new ethers.providers.Web3Provider(window.ethereum);
  } else {
    // We are on the server *OR* the user is not running MetaMask
    return new ethers.providers.JsonRpcProvider(LINEA_TESTNET_RPC_URL, LINEA_TESTNET_CHAIN_ID);
  }
}

// Function to get signer
async function getSigner(): Promise<ethers.Signer> {
  const provider = getProvider();
  if (provider instanceof ethers.providers.Web3Provider) {
    // Request account access if needed
    await provider.send('eth_requestAccounts', []);
    return provider.getSigner();
  } else {
    throw new Error("MetaMask not detected. Please use a Web3-enabled browser.");
  }
}

// Function to get contract instance
async function getContract(): Promise<ethers.Contract> {
  const signer = await getSigner();
  const ZKBountyArtifact = await artifacts.readArtifact(contractName);
  return new ethers.Contract(contractAddress, ZKBountyArtifact.abi, signer);
}

// Utility functions to interact with the contract

export async function registerIssuer(): Promise<ethers.ContractReceipt> {
  const contract = await getContract();
  const tx = await contract.registerIssuer();
  return tx.wait();
}

export async function registerToBounty(bountyId: string) {
  const contract = await getContract();
  const tx = await contract.registerToBounty(bountyId);
  return tx.wait();
}

export async function submitReport(bountyId: string, reportHash: string) {
  const contract = await getContract();
  const tx = await contract.submitReport(bountyId, reportHash);
  return tx.wait();
}

export async function finalizeReport(bountyId: string, hunter: string, hash: string) {
  const contract = await getContract();
  const tx = await contract.finalizeReport(bountyId, hunter, hash);
  return tx.wait();
}

export async function withdrawUnapprovedBounty(bountyId: string) {
  const contract = await getContract();
  const tx = await contract.withdrawUnapprovedBounty(bountyId);
  return tx.wait();
}

// Read functions

export async function getBounty(bountyId: string) {
  const contract = await getContract();
  return contract.getBounty(bountyId);
}

export async function getBountyReward(bountyId: string) {
  const contract = await getContract();
  const reward = await contract.getBountyReward(bountyId);
  return ethers.utils.formatEther(reward);
}

export async function getBountyIds() {
  const contract = await getContract();
  return contract.getBountyIds();
}

export async function getBountyAtIndex(index: number) {
  const contract = await getContract();
  return contract.getBountyAtIndex(index);
}

export async function getReportHash(bountyId: string, hunter: string) {
  const contract = await getContract();
  return contract.getReportHash(bountyId, hunter);
}

export async function getHuntersInBounty(bountyId: string) {
  const contract = await getContract();
  return contract.getHuntersInBounty(bountyId);
}

export async function getSubmittedReportsInBounty(bountyId: string) {
  const contract = await getContract();
  return contract.getSubmittedReportsInBounty(bountyId);
}

export async function isRegisteredIssuer(issuer: string) {
  const contract = await getContract();
  return contract.isRegisteredIssuer(issuer);
}