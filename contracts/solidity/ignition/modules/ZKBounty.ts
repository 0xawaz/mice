import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const JAN_1ST_2030 = 1893456000;
const ONE_GWEI: bigint = 1_000_000_000n;

const ZKBountyModule = buildModule("ZKBountyModule", (m) => {

  const zkbounty = m.contract("ZKBounty");

  return { zkbounty };
});

export default ZKBountyModule;
