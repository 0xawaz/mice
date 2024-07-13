import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import '@openzeppelin/hardhat-upgrades';
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    lineaGoerli: {
      url: "https://rpc.goerli.linea.build",
      chainId: 59140,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;