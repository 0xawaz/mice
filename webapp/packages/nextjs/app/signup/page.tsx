"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "~~/components/ui/button";

// Adjust the import path according to your file structure

const StepSignup = () => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("");
  const router = useRouter();

  const handleSelection = (selection: string) => {
    setSelectedRole(selection);
  };

  const handleNext = () => {
    if (selectedRole === "hacker") {
      router.push("/explore");
    } else if (selectedRole === "company") {
      setStep(2);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          key="step-1"
          transition={{ duration: 0.95, ease: [0.165, 0.84, 0.44, 1] }}
          className="mx-auto max-w-md text-center"
        >
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Secure Your Web3 Future</h1>
            <p className="text-muted-foreground">Choose your path: Protect or Infiltrate.</p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleSelection("hacker")}
                className={`inline-flex h-16 w-full items-center justify-center rounded-md ${
                  selectedRole === "hacker"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                } px-8 text-lg font-medium shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
              >
                Hacker
              </Button>
              <Button
                onClick={() => handleSelection("company")}
                className={`inline-flex h-16 w-full items-center justify-center rounded-md ${
                  selectedRole === "company"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                } px-8 text-lg font-medium shadow-sm transition-colors hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2`}
              >
                Company
              </Button>
            </div>
            <Button onClick={handleNext} className="w-full mt-4">
              Next
            </Button>
          </div>
        </motion.div>
      )}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          key="step-2"
          transition={{ duration: 0.95, ease: [0.165, 0.84, 0.44, 1] }}
          className="max-w-lg mx-auto px-4 lg:px-0"
        >
          <h2 className="text-4xl font-bold text-primary">Register a Bounty</h2>
          <p className="text-[14px] leading-[20px] text-primary-foreground font-normal my-4">
            Fill out the details to register a new bounty.
          </p>
          {/* Bounty registration form goes here */}
          <Button
            className="w-full mt-4"
            onClick={() => {
              // Handle the bounty registration process
              console.log("Registering bounty...");
            }}
          >
            Submit Bounty
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default StepSignup;
