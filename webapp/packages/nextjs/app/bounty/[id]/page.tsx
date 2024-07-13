"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { NextPage } from "next";

const BountyDetail: NextPage = () => {
  const { primaryWallet, networkConfigurations } = useDynamicContext();

  const bounty = {
    title: "Build a Web3 Dashboard",
    issuer: "Acme Web3 Inc.",
    status: "Open",
    description: `
      We're looking for a talented developer to build a comprehensive Web3 dashboard that integrates with popular
      blockchain protocols and provides users with a seamless experience to manage their decentralized assets and
      transactions.

      The dashboard should include features such as wallet management, token tracking, transaction history, and
      support for multiple blockchains like Ethereum, Solana, and Polygon.

      You will be responsible for designing the user interface, implementing the core functionality, and ensuring
      the application is secure and scalable.
    `,
    requirements: [
      "Familiarity with Web3 technologies and blockchain development",
      "Experience with React.js and modern front-end frameworks",
      "Knowledge of decentralized finance (DeFi) protocols and APIs",
      "Ability to create a visually appealing and user-friendly interface",
      "Strong problem-solving and analytical skills",
    ],
    bounty: "5 ETH",
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <header className="px-6 py-4 border-b border-[#333333]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/placeholder.svg" width={40} height={40} alt="Issuer Logo" className="rounded-full" />
            <div>
              <h1 className="text-2xl font-bold">Bounty: {bounty.title}</h1>
              <p className="text-sm text-[#CCCCCC]">Issued by {bounty.issuer}</p>
            </div>
          </div>
          <div>
            <Badge variant="secondary" className="text-xs">
              {bounty.status}
            </Badge>
          </div>
        </div>
      </header>
      <div className="flex-1 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold">Description</h2>
          <p className="text-[#CCCCCC] mt-2">{bounty.description}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Requirements</h2>
          <ul className="list-disc pl-6 space-y-2 text-[#CCCCCC] mt-2">
            {bounty.requirements.map((requirement, index) => (
              <li key={index}>{requirement}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold">Bounty</h2>
          <p className="text-[#CCCCCC] mt-2">
            The bounty for this project is {bounty.bounty}, payable upon successful completion and acceptance of the
            final deliverable.
          </p>
        </div>
      </div>
      <div className="bg-[#1E1E1E] px-6 py-4 border-t border-[#333333] flex justify-end">
        <Button className="px-6 py-3 text-lg font-medium">Submit Vulnerability</Button>
      </div>
    </div>
  );
};

export default BountyDetail;
