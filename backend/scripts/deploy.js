const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("----------------------------------------------------");
  console.log("Deploying ResearchPaperTracker smart contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const TrackerFactory = await ethers.getContractFactory("ResearchPaperTracker");
  const tracker = await TrackerFactory.deploy(deployer.address);
  await tracker.waitForDeployment();

  const contractAddress = await tracker.getAddress();
  console.log("ResearchPaperTracker successfully deployed to:", contractAddress);

  // Read the artifact for ABI
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/ResearchPaperTracker.sol/ResearchPaperTracker.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Ensure output directory exists
  const outputDir = path.join(__dirname, "../src/blockchain");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const deploymentData = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    address: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  const outputPath = path.join(outputDir, "deployedContract.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log("Deployment details and ABI saved to:", outputPath);
  console.log("----------------------------------------------------");

  return deploymentData;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;
