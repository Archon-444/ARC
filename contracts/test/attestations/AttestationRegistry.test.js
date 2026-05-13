const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * AttestationRegistry behavior tests (W9).
 *
 * Coverage:
 *   - constructor: zero-admin reject, DEFAULT_ADMIN_ROLE grant.
 *   - attest: role-gating, validation (subject != 0, schemaId != 0,
 *     dataHash != 0, expiry not in past), deterministic id derivation,
 *     event emission, per-(subject, schemaId) append, per-signer
 *     nonce, no-expiry path (expiry=0).
 *   - revoke: caller must be signer or admin; idempotent; emits;
 *     unknown id reverts; isValid flips false post-revoke.
 *   - isValid: returns false for unknown, false post-expiry, false
 *     post-revoke; true for the freshly-attested unexpired record.
 *   - attestationCount / attestationAt: pagination + oob revert.
 *   - integration: id derivation matches keccak256(abi.encode(...))
 *     so off-chain helpers can predict ids before submission.
 */
describe("AttestationRegistry (W9)", function () {
  let registry, admin, attester1, attester2, subject;
  const ATTESTER_ROLE = ethers.id("ATTESTER_ROLE");

  const SCHEMA_COUNSEL = ethers.id("counsel.kyb.v1");
  const SCHEMA_EDITORIAL = ethers.id("editorial.review.v1");
  const DH1 = ethers.id("counsel.kyb.v1:body-1");
  const DH2 = ethers.id("counsel.kyb.v1:body-2");
  const DH3 = ethers.id("editorial.review.v1:body-1");

  beforeEach(async function () {
    [admin, attester1, attester2, subject] = await ethers.getSigners();
    const AttestationRegistry = await ethers.getContractFactory("AttestationRegistry");
    registry = await AttestationRegistry.deploy(admin.address);
    await registry.waitForDeployment();
    await registry.connect(admin).grantRole(ATTESTER_ROLE, attester1.address);
    await registry.connect(admin).grantRole(ATTESTER_ROLE, attester2.address);
  });

  describe("constructor", function () {
    it("reverts on zero admin", async function () {
      const AttestationRegistry = await ethers.getContractFactory("AttestationRegistry");
      await expect(AttestationRegistry.deploy(ethers.ZeroAddress)).to.be.revertedWith(
        "AttestationRegistry: admin=0"
      );
    });

    it("grants DEFAULT_ADMIN_ROLE to admin", async function () {
      expect(
        await registry.hasRole(await registry.DEFAULT_ADMIN_ROLE(), admin.address)
      ).to.equal(true);
    });
  });

  describe("attest", function () {
    it("rejects callers without ATTESTER_ROLE", async function () {
      await expect(registry.connect(subject).attest(subject.address, SCHEMA_COUNSEL, DH1, 0)).to
        .be.reverted;
    });

    it("rejects subject=0", async function () {
      await expect(
        registry.connect(attester1).attest(ethers.ZeroAddress, SCHEMA_COUNSEL, DH1, 0)
      ).to.be.revertedWith("AttestationRegistry: subject=0");
    });

    it("rejects schemaId=0", async function () {
      await expect(
        registry.connect(attester1).attest(subject.address, ethers.ZeroHash, DH1, 0)
      ).to.be.revertedWith("AttestationRegistry: schemaId=0");
    });

    it("rejects dataHash=0", async function () {
      await expect(
        registry.connect(attester1).attest(subject.address, SCHEMA_COUNSEL, ethers.ZeroHash, 0)
      ).to.be.revertedWith("AttestationRegistry: dataHash=0");
    });

    it("rejects expiry in the past", async function () {
      const now = await time.latest();
      await expect(
        registry.connect(attester1).attest(subject.address, SCHEMA_COUNSEL, DH1, now - 1)
      ).to.be.revertedWith("AttestationRegistry: expiry in past");
    });

    it("accepts expiry=0 (no expiry)", async function () {
      await expect(
        registry.connect(attester1).attest(subject.address, SCHEMA_COUNSEL, DH1, 0)
      ).to.emit(registry, "Attested");
    });

    it("derives id deterministically from inputs", async function () {
      const expiry = (await time.latest()) + 86400;
      const nonce = await registry.nextNonce(attester1.address);
      const expectedId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "bytes32", "bytes32", "uint64", "address", "uint256"],
          [subject.address, SCHEMA_COUNSEL, DH1, expiry, attester1.address, nonce]
        )
      );
      await expect(registry.connect(attester1).attest(subject.address, SCHEMA_COUNSEL, DH1, expiry))
        .to.emit(registry, "Attested")
        .withArgs(expectedId, subject.address, SCHEMA_COUNSEL, DH1, expiry, attester1.address);
    });

    it("advances the per-signer nonce", async function () {
      expect(await registry.nextNonce(attester1.address)).to.equal(0n);
      await registry.connect(attester1).attest(subject.address, SCHEMA_COUNSEL, DH1, 0);
      expect(await registry.nextNonce(attester1.address)).to.equal(1n);
      // Other attester is independent.
      expect(await registry.nextNonce(attester2.address)).to.equal(0n);
    });

    it("stores the attestation record correctly", async function () {
      const expiry = (await time.latest()) + 86400;
      await registry.connect(attester1).attest(subject.address, SCHEMA_COUNSEL, DH1, expiry);
      const id = await registry.attestationAt(subject.address, SCHEMA_COUNSEL, 0);
      const a = await registry.getAttestation(id);
      expect(a.subject).to.equal(subject.address);
      expect(a.schemaId).to.equal(SCHEMA_COUNSEL);
      expect(a.dataHash).to.equal(DH1);
      expect(a.expiry).to.equal(expiry);
      expect(a.signer).to.equal(attester1.address);
      expect(a.revoked).to.equal(false);
      expect(a.createdAt).to.be.gt(0n);
    });
  });

  describe("revoke", function () {
    let id;

    beforeEach(async function () {
      const tx = await registry
        .connect(attester1)
        .attest(subject.address, SCHEMA_COUNSEL, DH1, 0);
      const rcpt = await tx.wait();
      id = rcpt.logs[0].topics[1];
    });

    it("rejects unknown id", async function () {
      await expect(registry.connect(attester1).revoke(ethers.id("nope"))).to.be.revertedWith(
        "AttestationRegistry: unknown"
      );
    });

    it("non-signer non-admin cannot revoke", async function () {
      await expect(registry.connect(attester2).revoke(id)).to.be.revertedWith(
        "AttestationRegistry: not authorized"
      );
    });

    it("original signer can revoke", async function () {
      await expect(registry.connect(attester1).revoke(id))
        .to.emit(registry, "Revoked")
        .withArgs(id, attester1.address);
      const a = await registry.getAttestation(id);
      expect(a.revoked).to.equal(true);
    });

    it("admin can revoke", async function () {
      await expect(registry.connect(admin).revoke(id))
        .to.emit(registry, "Revoked")
        .withArgs(id, admin.address);
    });

    it("is idempotent (revoking a revoked attestation is a no-op)", async function () {
      await registry.connect(attester1).revoke(id);
      const tx = await registry.connect(attester1).revoke(id);
      const rcpt = await tx.wait();
      const revokeLogs = rcpt.logs.filter(
        (l) => l.topics[0] === registry.interface.getEvent("Revoked").topicHash
      );
      expect(revokeLogs).to.have.length(0);
    });
  });

  describe("isValid", function () {
    it("returns false for unknown id", async function () {
      expect(await registry.isValid(ethers.id("nope"))).to.equal(false);
    });

    it("returns true for a freshly attested record with no expiry", async function () {
      const tx = await registry
        .connect(attester1)
        .attest(subject.address, SCHEMA_COUNSEL, DH1, 0);
      const rcpt = await tx.wait();
      const id = rcpt.logs[0].topics[1];
      expect(await registry.isValid(id)).to.equal(true);
    });

    it("returns false post-revoke", async function () {
      const tx = await registry
        .connect(attester1)
        .attest(subject.address, SCHEMA_COUNSEL, DH1, 0);
      const rcpt = await tx.wait();
      const id = rcpt.logs[0].topics[1];
      await registry.connect(attester1).revoke(id);
      expect(await registry.isValid(id)).to.equal(false);
    });

    it("returns false after expiry has elapsed", async function () {
      const expiry = (await time.latest()) + 60; // 60s
      const tx = await registry
        .connect(attester1)
        .attest(subject.address, SCHEMA_COUNSEL, DH1, expiry);
      const rcpt = await tx.wait();
      const id = rcpt.logs[0].topics[1];

      expect(await registry.isValid(id)).to.equal(true);
      await time.increaseTo(expiry + 1);
      expect(await registry.isValid(id)).to.equal(false);
    });
  });

  describe("attestationCount / attestationAt", function () {
    it("starts at 0 for an unseen (subject, schema) pair", async function () {
      expect(await registry.attestationCount(subject.address, SCHEMA_COUNSEL)).to.equal(0n);
    });

    it("increments per (subject, schemaId) pair", async function () {
      await registry.connect(attester1).attest(subject.address, SCHEMA_COUNSEL, DH1, 0);
      await registry.connect(attester2).attest(subject.address, SCHEMA_COUNSEL, DH2, 0);
      await registry.connect(attester1).attest(subject.address, SCHEMA_EDITORIAL, DH3, 0);

      expect(await registry.attestationCount(subject.address, SCHEMA_COUNSEL)).to.equal(2n);
      expect(await registry.attestationCount(subject.address, SCHEMA_EDITORIAL)).to.equal(1n);
    });

    it("reverts on out-of-bounds index", async function () {
      await expect(
        registry.attestationAt(subject.address, SCHEMA_COUNSEL, 0)
      ).to.be.revertedWith("AttestationRegistry: index oob");
    });

    it("returns ids in insertion order", async function () {
      const tx1 = await registry
        .connect(attester1)
        .attest(subject.address, SCHEMA_COUNSEL, DH1, 0);
      const tx2 = await registry
        .connect(attester2)
        .attest(subject.address, SCHEMA_COUNSEL, DH2, 0);
      const r1 = await tx1.wait();
      const r2 = await tx2.wait();
      const id1 = r1.logs[0].topics[1];
      const id2 = r2.logs[0].topics[1];

      expect(await registry.attestationAt(subject.address, SCHEMA_COUNSEL, 0)).to.equal(id1);
      expect(await registry.attestationAt(subject.address, SCHEMA_COUNSEL, 1)).to.equal(id2);
    });
  });

  describe("getAttestation (unknown id)", function () {
    it("returns zero-valued struct without revert", async function () {
      const a = await registry.getAttestation(ethers.id("nope"));
      expect(a.subject).to.equal(ethers.ZeroAddress);
      expect(a.schemaId).to.equal(ethers.ZeroHash);
      expect(a.dataHash).to.equal(ethers.ZeroHash);
      expect(a.expiry).to.equal(0n);
      expect(a.createdAt).to.equal(0n);
      expect(a.signer).to.equal(ethers.ZeroAddress);
      expect(a.revoked).to.equal(false);
    });
  });
});
