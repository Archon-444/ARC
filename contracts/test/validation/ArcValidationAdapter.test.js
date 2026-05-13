const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * ArcValidationAdapter behavior tests (W10).
 *
 * Coverage:
 *   - constructor: zero-admin reject, DEFAULT_ADMIN_ROLE grant.
 *   - recordValidation: role-gating, validation (subject != 0,
 *     claim != 0, dataHash != 0, expiry not in past), deterministic
 *     id derivation, event emission, per-(subject, claim) append,
 *     per-validator nonce.
 *   - outcome=false is recorded the same as outcome=true (failures
 *     are information; isValid does NOT consider outcome).
 *   - revokeValidation: caller must be validator or admin;
 *     idempotent; emits; unknown id reverts; isValid flips false
 *     post-revoke.
 *   - isValid: false for unknown, post-expiry, post-revoke; true for
 *     freshly recorded unexpired records regardless of outcome.
 *   - validationCount / validationAt: pagination + oob revert.
 */
describe("ArcValidationAdapter (W10)", function () {
  let adapter, admin, validator1, validator2, subject;
  const VALIDATOR_ROLE = ethers.id("VALIDATOR_ROLE");

  const CLAIM_AUDIT = ethers.id("contract.audit.v1");
  const CLAIM_POLICY = ethers.id("policy.compliance.v1");
  const DH1 = ethers.id("audit-report-1");
  const DH2 = ethers.id("audit-report-2");

  beforeEach(async function () {
    [admin, validator1, validator2, subject] = await ethers.getSigners();
    const ArcValidationAdapter = await ethers.getContractFactory("ArcValidationAdapter");
    adapter = await ArcValidationAdapter.deploy(admin.address);
    await adapter.waitForDeployment();
    await adapter.connect(admin).grantRole(VALIDATOR_ROLE, validator1.address);
    await adapter.connect(admin).grantRole(VALIDATOR_ROLE, validator2.address);
  });

  describe("constructor", function () {
    it("reverts on zero admin", async function () {
      const ArcValidationAdapter = await ethers.getContractFactory("ArcValidationAdapter");
      await expect(ArcValidationAdapter.deploy(ethers.ZeroAddress)).to.be.revertedWith(
        "ArcValidationAdapter: admin=0"
      );
    });
  });

  describe("recordValidation", function () {
    it("rejects callers without VALIDATOR_ROLE", async function () {
      await expect(
        adapter.connect(subject).recordValidation(subject.address, CLAIM_AUDIT, true, 0, DH1)
      ).to.be.reverted;
    });

    it("rejects subject=0", async function () {
      await expect(
        adapter
          .connect(validator1)
          .recordValidation(ethers.ZeroAddress, CLAIM_AUDIT, true, 0, DH1)
      ).to.be.revertedWith("ArcValidationAdapter: subject=0");
    });

    it("rejects claim=0", async function () {
      await expect(
        adapter
          .connect(validator1)
          .recordValidation(subject.address, ethers.ZeroHash, true, 0, DH1)
      ).to.be.revertedWith("ArcValidationAdapter: claim=0");
    });

    it("rejects dataHash=0", async function () {
      await expect(
        adapter
          .connect(validator1)
          .recordValidation(subject.address, CLAIM_AUDIT, true, 0, ethers.ZeroHash)
      ).to.be.revertedWith("ArcValidationAdapter: dataHash=0");
    });

    it("rejects expiry in the past", async function () {
      const now = await time.latest();
      await expect(
        adapter
          .connect(validator1)
          .recordValidation(subject.address, CLAIM_AUDIT, true, now - 1, DH1)
      ).to.be.revertedWith("ArcValidationAdapter: expiry in past");
    });

    it("derives id deterministically", async function () {
      const expiry = (await time.latest()) + 86400;
      const nonce = await adapter.nextNonce(validator1.address);
      const expectedId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "bytes32", "address", "bool", "uint64", "bytes32", "uint256"],
          [subject.address, CLAIM_AUDIT, validator1.address, true, expiry, DH1, nonce]
        )
      );
      await expect(
        adapter
          .connect(validator1)
          .recordValidation(subject.address, CLAIM_AUDIT, true, expiry, DH1)
      )
        .to.emit(adapter, "ValidationRecorded")
        .withArgs(expectedId, subject.address, CLAIM_AUDIT, validator1.address, true, expiry, DH1);
    });

    it("stores the record correctly (outcome=true)", async function () {
      await adapter.connect(validator1).recordValidation(subject.address, CLAIM_AUDIT, true, 0, DH1);
      const id = await adapter.validationAt(subject.address, CLAIM_AUDIT, 0);
      const [s, c, v, o, e, ts, dh, rv] = await adapter.getValidation(id);
      expect(s).to.equal(subject.address);
      expect(c).to.equal(CLAIM_AUDIT);
      expect(v).to.equal(validator1.address);
      expect(o).to.equal(true);
      expect(e).to.equal(0n);
      expect(ts).to.be.gt(0n);
      expect(dh).to.equal(DH1);
      expect(rv).to.equal(false);
    });

    it("records outcome=false the same way (failures are information)", async function () {
      await adapter
        .connect(validator1)
        .recordValidation(subject.address, CLAIM_AUDIT, false, 0, DH1);
      const id = await adapter.validationAt(subject.address, CLAIM_AUDIT, 0);
      const [, , , o] = await adapter.getValidation(id);
      expect(o).to.equal(false);
      // isValid does NOT consider outcome — a recorded failure is
      // still a valid record.
      expect(await adapter.isValid(id)).to.equal(true);
    });

    it("advances per-validator nonces independently", async function () {
      expect(await adapter.nextNonce(validator1.address)).to.equal(0n);
      await adapter.connect(validator1).recordValidation(subject.address, CLAIM_AUDIT, true, 0, DH1);
      expect(await adapter.nextNonce(validator1.address)).to.equal(1n);
      expect(await adapter.nextNonce(validator2.address)).to.equal(0n);
    });
  });

  describe("revokeValidation", function () {
    let id;

    beforeEach(async function () {
      const tx = await adapter
        .connect(validator1)
        .recordValidation(subject.address, CLAIM_AUDIT, true, 0, DH1);
      const rcpt = await tx.wait();
      id = rcpt.logs[0].topics[1];
    });

    it("rejects unknown id", async function () {
      await expect(adapter.connect(validator1).revokeValidation(ethers.id("nope"))).to.be
        .revertedWith("ArcValidationAdapter: unknown");
    });

    it("non-validator non-admin cannot revoke", async function () {
      await expect(adapter.connect(validator2).revokeValidation(id)).to.be.revertedWith(
        "ArcValidationAdapter: not authorized"
      );
    });

    it("original validator can revoke", async function () {
      await expect(adapter.connect(validator1).revokeValidation(id))
        .to.emit(adapter, "ValidationRevoked")
        .withArgs(id, validator1.address);
      expect(await adapter.isValid(id)).to.equal(false);
    });

    it("admin can revoke", async function () {
      await expect(adapter.connect(admin).revokeValidation(id))
        .to.emit(adapter, "ValidationRevoked")
        .withArgs(id, admin.address);
    });

    it("is idempotent (no second event)", async function () {
      await adapter.connect(validator1).revokeValidation(id);
      const tx = await adapter.connect(validator1).revokeValidation(id);
      const rcpt = await tx.wait();
      const revokeLogs = rcpt.logs.filter(
        (l) => l.topics[0] === adapter.interface.getEvent("ValidationRevoked").topicHash
      );
      expect(revokeLogs).to.have.length(0);
    });
  });

  describe("isValid", function () {
    it("returns false for unknown id", async function () {
      expect(await adapter.isValid(ethers.id("nope"))).to.equal(false);
    });

    it("returns true for outcome=true with no expiry", async function () {
      const tx = await adapter
        .connect(validator1)
        .recordValidation(subject.address, CLAIM_AUDIT, true, 0, DH1);
      const id = (await tx.wait()).logs[0].topics[1];
      expect(await adapter.isValid(id)).to.equal(true);
    });

    it("returns true for outcome=false with no expiry (outcome != validity)", async function () {
      const tx = await adapter
        .connect(validator1)
        .recordValidation(subject.address, CLAIM_AUDIT, false, 0, DH1);
      const id = (await tx.wait()).logs[0].topics[1];
      expect(await adapter.isValid(id)).to.equal(true);
    });

    it("returns false after expiry has elapsed", async function () {
      const expiry = (await time.latest()) + 60;
      const tx = await adapter
        .connect(validator1)
        .recordValidation(subject.address, CLAIM_AUDIT, true, expiry, DH1);
      const id = (await tx.wait()).logs[0].topics[1];
      expect(await adapter.isValid(id)).to.equal(true);
      await time.increaseTo(expiry + 1);
      expect(await adapter.isValid(id)).to.equal(false);
    });
  });

  describe("validationCount / validationAt", function () {
    it("starts at 0 for an unseen (subject, claim) pair", async function () {
      expect(await adapter.validationCount(subject.address, CLAIM_AUDIT)).to.equal(0n);
    });

    it("increments per (subject, claim) pair, independent of other pairs", async function () {
      await adapter.connect(validator1).recordValidation(subject.address, CLAIM_AUDIT, true, 0, DH1);
      await adapter.connect(validator2).recordValidation(subject.address, CLAIM_AUDIT, true, 0, DH2);
      await adapter
        .connect(validator1)
        .recordValidation(subject.address, CLAIM_POLICY, false, 0, DH1);

      expect(await adapter.validationCount(subject.address, CLAIM_AUDIT)).to.equal(2n);
      expect(await adapter.validationCount(subject.address, CLAIM_POLICY)).to.equal(1n);
    });

    it("reverts on out-of-bounds index", async function () {
      await expect(adapter.validationAt(subject.address, CLAIM_AUDIT, 0)).to.be.revertedWith(
        "ArcValidationAdapter: index oob"
      );
    });
  });

  describe("getValidation (unknown id)", function () {
    it("returns zero values without revert", async function () {
      const [s, c, v, o, e, ts, dh, rv] = await adapter.getValidation(ethers.id("nope"));
      expect(s).to.equal(ethers.ZeroAddress);
      expect(c).to.equal(ethers.ZeroHash);
      expect(v).to.equal(ethers.ZeroAddress);
      expect(o).to.equal(false);
      expect(e).to.equal(0n);
      expect(ts).to.equal(0n);
      expect(dh).to.equal(ethers.ZeroHash);
      expect(rv).to.equal(false);
    });
  });
});
