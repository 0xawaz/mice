import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const ZKBounty = await ethers.getContractFactory("ZKBounty");
  const zKBounty = await ZKBounty.deploy();

  await zKBounty.waitForDeployment();

  console.log("Contract deployed to:", await zKBounty.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });