const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const BlockchainTransaction = require("../models/BlockchainTransaction");
const hashService = require("./hashService");

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.contractAddress = null;
    this.abi = null;
    this.initialized = false;
    this.txQueue = Promise.resolve();
    this.currentNonce = null;
  }

  /**
   * Initializes the blockchain provider, relayer wallet, and smart contract instance.
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
      const privateKey =
        process.env.BLOCKCHAIN_PRIVATE_KEY ||
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Default Hardhat account 0

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // Load artifact and address
      const deploymentFile = path.join(__dirname, "../blockchain/deployedContract.json");
      if (fs.existsSync(deploymentFile)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
        this.contractAddress = process.env.CONTRACT_ADDRESS || deployment.address;
        this.abi = deployment.abi;
      } else {
        const artifactPath = path.join(
          __dirname,
          "../../artifacts/contracts/ResearchPaperTracker.sol/ResearchPaperTracker.json"
        );
        if (fs.existsSync(artifactPath)) {
          const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
          this.abi = artifact.abi;
          this.contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        }
      }

      if (!this.contractAddress || !this.abi) {
        throw new Error("Contract ABI or address not found. Please compile and deploy the contract first.");
      }

      // Check if network is reachable
      try {
        const code = await this.provider.getCode(this.contractAddress);
        if (code === "0x") {
          console.warn(`[BlockchainService] Warning: No contract code at ${this.contractAddress}. Contract might need deployment on this network.`);
        }
      } catch (connErr) {
        console.warn(`[BlockchainService] Notice: Could not query network at ${rpcUrl} during startup. Transactions will attempt on demand.`);
      }

      this.contract = new ethers.Contract(this.contractAddress, this.abi, this.wallet);
      this.initialized = true;
      console.log(`[BlockchainService] Initialized contract at ${this.contractAddress} via relayer ${this.wallet.address}`);
    } catch (error) {
      console.error("[BlockchainService] Initialization error:", error.message);
      throw error;
    }
  }

  async ensureReady() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Thread-safe transaction execution through a sequential promise queue.
   */
  async executeTransaction(operationType, entityType, entityId, paperId, version, actorPseudonym, dataHash, contractMethod, ...args) {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      this.txQueue = this.txQueue
        .catch(() => {}) // Continue queue even if a previous tx failed
        .then(async () => {
          try {
            const result = await this._processTransaction(
              operationType,
              entityType,
              entityId,
              paperId,
              version,
              actorPseudonym,
              dataHash,
              contractMethod,
              ...args
            );
            resolve(result);
          } catch (err) {
            reject(err);
          }
        });
    });
  }

  async _processTransaction(operationType, entityType, entityId, paperId, version, actorPseudonym, dataHash, contractMethod, ...args) {
    try {
      const rawCount = await this.provider.send("eth_getTransactionCount", [this.wallet.address, "pending"]);
      const networkNonce = parseInt(rawCount, 16);
      if (this.currentNonce === null || networkNonce > this.currentNonce) {
        this.currentNonce = networkNonce;
      }
      const nonce = this.currentNonce++;
      console.log(`[BlockchainService] Executing ${operationType} on-chain for paper ${paperId} (nonce: ${nonce})...`);

      const tx = await this.contract[contractMethod](...args, { nonce });
      console.log(`[BlockchainService] Tx submitted: ${tx.hash}, awaiting confirmation...`);

      const receipt = await tx.wait(1);
      if (!receipt || receipt.status !== 1) {
        throw new Error(`Transaction failed with receipt status: ${receipt ? receipt.status : "unknown"}`);
      }

      console.log(`[BlockchainService] Tx confirmed in block ${receipt.blockNumber}`);

      const record = await BlockchainTransaction.create({
        txHash: tx.hash,
        operationType,
        eventType: operationType,
        entityType,
        entityId,
        paperId: String(paperId),
        version: Number(version || 1),
        actorPseudonym,
        dataHash,
        blockNumber: Number(receipt.blockNumber),
        from: receipt.from,
        to: receipt.to,
        gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null,
        status: "confirmed",
        timestamp: new Date(),
      });

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null,
        recordId: record._id,
      };
    } catch (error) {
      this.currentNonce = null;
      console.error(`[BlockchainService] Error executing ${operationType}:`, error);

      if (error.transaction?.hash) {
        try {
          await BlockchainTransaction.create({
            txHash: error.transaction.hash,
            operationType,
            eventType: operationType,
            entityType,
            entityId,
            paperId: String(paperId),
            version: Number(version || 1),
            actorPseudonym,
            dataHash,
            status: "failed",
            errorMessage: error.message,
            timestamp: new Date(),
          });
        } catch (dbErr) {
          console.error("[BlockchainService] Failed to record error tx:", dbErr.message);
        }
      }

      throw error;
    }
  }

  // ==========================================
  // Write Operations
  // ==========================================

  async registerPaper(paperId, authorPseudonym, fileHash, entityId) {
    const bytes32FileHash = hashService.toBytes32(fileHash);
    return this.executeTransaction(
      "PaperRegistered",
      "Paper",
      entityId,
      paperId,
      1,
      authorPseudonym,
      fileHash,
      "registerPaper",
      String(paperId),
      String(authorPseudonym),
      bytes32FileHash
    );
  }

  async registerPaperVersion(paperId, version, fileHash, entityId, authorPseudonym) {
    const bytes32FileHash = hashService.toBytes32(fileHash);
    return this.executeTransaction(
      "VersionRegistered",
      "PaperVersion",
      entityId,
      paperId,
      version,
      authorPseudonym,
      fileHash,
      "registerPaperVersion",
      String(paperId),
      BigInt(version),
      bytes32FileHash
    );
  }

  async recordReviewerAssignment(paperId, reviewerPseudonym, entityId) {
    return this.executeTransaction(
      "ReviewerAssigned",
      "ReviewerAssignment",
      entityId,
      paperId,
      1,
      reviewerPseudonym,
      null,
      "recordReviewerAssignment",
      String(paperId),
      String(reviewerPseudonym)
    );
  }

  async registerReview(reviewId, paperId, reviewerPseudonym, reviewHash, overallScore, entityId) {
    const bytes32ReviewHash = hashService.toBytes32(reviewHash);
    const scoreInt = Math.min(Math.max(Math.round(overallScore), 1), 10);
    return this.executeTransaction(
      "ReviewSubmitted",
      "Review",
      entityId,
      paperId,
      1,
      reviewerPseudonym,
      reviewHash,
      "registerReview",
      String(reviewId),
      String(paperId),
      String(reviewerPseudonym),
      bytes32ReviewHash,
      scoreInt
    );
  }

  async recordDecision(paperId, decisionStatus, decisionHash, entityId) {
    const bytes32DecisionHash = hashService.toBytes32(decisionHash);
    return this.executeTransaction(
      "DecisionRecorded",
      "Decision",
      entityId,
      paperId,
      1,
      "ADMIN",
      decisionHash,
      "recordDecision",
      String(paperId),
      String(decisionStatus),
      bytes32DecisionHash
    );
  }

  // ==========================================
  // Public Verification & Read Operations
  // ==========================================

  async verifyPaperVersionHash(paperId, version, fileHash) {
    await this.ensureReady();
    const bytes32Hash = hashService.toBytes32(fileHash);
    const [matches, timestamp, registeredHash] = await this.contract.verifyPaperVersionHash(
      String(paperId),
      BigInt(version),
      bytes32Hash
    );

    return {
      matches,
      timestamp: Number(timestamp),
      date: timestamp > 0n ? new Date(Number(timestamp) * 1000).toISOString() : null,
      registeredHash,
    };
  }

  async verifyReviewHash(reviewId, reviewHash) {
    await this.ensureReady();
    const bytes32Hash = hashService.toBytes32(reviewHash);
    const [matches, timestamp, registeredHash] = await this.contract.verifyReviewHash(
      String(reviewId),
      bytes32Hash
    );

    return {
      matches,
      timestamp: Number(timestamp),
      date: timestamp > 0n ? new Date(Number(timestamp) * 1000).toISOString() : null,
      registeredHash,
    };
  }

  async getPaperOnChain(paperId) {
    await this.ensureReady();
    const [authorPseudonym, currentVersion, registeredAt, exists] = await this.contract.getPaper(String(paperId));
    if (!exists) return null;

    let versions = [];
    try {
      const vList = await this.contract.getAllVersions(String(paperId));
      versions = vList.map((v) => ({
        versionNumber: Number(v.versionNumber),
        fileHash: v.fileHash,
        registeredAt: Number(v.timestamp),
        registeredDate: new Date(Number(v.timestamp) * 1000).toISOString(),
      }));
    } catch (e) {
      console.warn("[BlockchainService] Error fetching versions list:", e.message);
    }

    let decision = null;
    try {
      const [decisionStatus, decisionHash, decidedAt, decExists] = await this.contract.getDecision(String(paperId));
      if (decExists) {
        decision = {
          status: decisionStatus,
          decisionHash,
          decidedAt: Number(decidedAt),
          decidedDate: new Date(Number(decidedAt) * 1000).toISOString(),
        };
      }
    } catch (e) {
      // No decision yet
    }

    return {
      exists: true,
      authorPseudonym,
      currentVersion: Number(currentVersion),
      registeredAt: Number(registeredAt),
      registeredDate: new Date(Number(registeredAt) * 1000).toISOString(),
      versions,
      decision,
    };
  }

  async getAllAuditEvents() {
    await this.ensureReady();
    const events = await this.contract.getAllAuditEvents();
    return events.map((ev) => ({
      eventId: Number(ev.eventId),
      eventType: ev.eventType,
      paperId: ev.paperId,
      version: Number(ev.version),
      actorPseudonym: ev.actorPseudonym,
      dataHash: ev.dataHash,
      timestamp: Number(ev.timestamp),
      date: new Date(Number(ev.timestamp) * 1000).toISOString(),
    }));
  }
}

module.exports = new BlockchainService();
