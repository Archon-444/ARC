const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Adapter-only behavior. Tests run against an in-memory Hardhat
 * Network EVM (no real testnet). The Passport contract integration is
 * exercised separately in ArcPassport.test.js.
 *
 * Coverage:
 *   - register: subject + URI validation, REGISTRAR_ROLE gating,
 *     duplicate-subject rejection, monotonic id issuance, event.
 *   - updateMetadata: ROLE gating, empty-URI rejection, revoked-id
 *     rejection, event.
 *   - revoke: idempotent, clears the reverse index, event,
 *     resolveBySubject returns 0 post-revoke.
 *   - getIdentity / resolveBySubject: read paths.
 *   - nextId: monotonic exposure for off-chain indexers.
 */
describe("ArcIdentityAdapter (W8)", function () {
  let adapter, admin, registrar, alice, bob;
  const URI_ALICE = "ipfs://bafkreialice";
  const URI_BOB = "ipfs://bafkreibob";
  const URI_ALICE_V2 = "ipfs://bafkreialice2";
  const REGISTRAR_ROLE = ethers.id("REGISTRAR_ROLE");

  beforeEach(async function () {
    [admin, registrar, alice, bob] = await ethers.getSigners();
    const ArcIdentityAdapter = await ethers.getContractFactory("ArcIdentityAdapter");
    adapter = await ArcIdentityAdapter.deploy(admin.address);
    await adapter.waitForDeployment();
    await adapter.connect(admin).grantRole(REGISTRAR_ROLE, registrar.address);
  });

  describe("constructor", function () {
    it("reverts on zero admin", async function () {
      const ArcIdentityAdapter = await ethers.getContractFactory("ArcIdentityAdapter");
      await expect(ArcIdentityAdapter.deploy(ethers.ZeroAddress)).to.be.revertedWith(
        "ArcIdentityAdapter: admin=0"
      );
    });

    it("grants DEFAULT_ADMIN_ROLE to admin", async function () {
      expect(await adapter.hasRole(await adapter.DEFAULT_ADMIN_ROLE(), admin.address)).to.equal(true);
    });

    it("nextId starts at 1 (0 reserved as 'no identity')", async function () {
      expect(await adapter.nextId()).to.equal(1n);
    });
  });

  describe("register", function () {
    it("rejects callers without REGISTRAR_ROLE", async function () {
      await expect(adapter.connect(alice).register(alice.address, URI_ALICE)).to.be.reverted;
    });

    it("rejects subject=0", async function () {
      await expect(
        adapter.connect(registrar).register(ethers.ZeroAddress, URI_ALICE)
      ).to.be.revertedWith("ArcIdentityAdapter: subject=0");
    });

    it("rejects empty URI", async function () {
      await expect(adapter.connect(registrar).register(alice.address, "")).to.be.revertedWith(
        "ArcIdentityAdapter: empty uri"
      );
    });

    it("emits IdentityRegistered with monotonic id and resolves subject", async function () {
      await expect(adapter.connect(registrar).register(alice.address, URI_ALICE))
        .to.emit(adapter, "IdentityRegistered")
        .withArgs(1n, alice.address, URI_ALICE);

      expect(await adapter.resolveBySubject(alice.address)).to.equal(1n);
      const [subject, uri, revoked] = await adapter.getIdentity(1n);
      expect(subject).to.equal(alice.address);
      expect(uri).to.equal(URI_ALICE);
      expect(revoked).to.equal(false);
      expect(await adapter.nextId()).to.equal(2n);
    });

    it("rejects re-registration while subject is active", async function () {
      await adapter.connect(registrar).register(alice.address, URI_ALICE);
      await expect(
        adapter.connect(registrar).register(alice.address, URI_ALICE_V2)
      ).to.be.revertedWith("ArcIdentityAdapter: already registered");
    });

    it("issues ids monotonically across multiple subjects", async function () {
      await adapter.connect(registrar).register(alice.address, URI_ALICE);
      await adapter.connect(registrar).register(bob.address, URI_BOB);
      expect(await adapter.resolveBySubject(alice.address)).to.equal(1n);
      expect(await adapter.resolveBySubject(bob.address)).to.equal(2n);
    });
  });

  describe("updateMetadata", function () {
    beforeEach(async function () {
      await adapter.connect(registrar).register(alice.address, URI_ALICE);
    });

    it("rejects callers without REGISTRAR_ROLE", async function () {
      await expect(adapter.connect(alice).updateMetadata(1n, URI_ALICE_V2)).to.be.reverted;
    });

    it("rejects unknown id", async function () {
      await expect(
        adapter.connect(registrar).updateMetadata(99n, URI_ALICE_V2)
      ).to.be.revertedWith("ArcIdentityAdapter: unknown id");
    });

    it("rejects empty URI", async function () {
      await expect(adapter.connect(registrar).updateMetadata(1n, "")).to.be.revertedWith(
        "ArcIdentityAdapter: empty uri"
      );
    });

    it("emits and persists the new URI", async function () {
      await expect(adapter.connect(registrar).updateMetadata(1n, URI_ALICE_V2))
        .to.emit(adapter, "IdentityMetadataUpdated")
        .withArgs(1n, URI_ALICE_V2);
      const [, uri] = await adapter.getIdentity(1n);
      expect(uri).to.equal(URI_ALICE_V2);
    });

    it("rejects updates on revoked ids", async function () {
      await adapter.connect(registrar).revoke(1n);
      await expect(
        adapter.connect(registrar).updateMetadata(1n, URI_ALICE_V2)
      ).to.be.revertedWith("ArcIdentityAdapter: revoked");
    });
  });

  describe("revoke", function () {
    beforeEach(async function () {
      await adapter.connect(registrar).register(alice.address, URI_ALICE);
    });

    it("rejects callers without REGISTRAR_ROLE", async function () {
      await expect(adapter.connect(alice).revoke(1n)).to.be.reverted;
    });

    it("rejects unknown id", async function () {
      await expect(adapter.connect(registrar).revoke(99n)).to.be.revertedWith(
        "ArcIdentityAdapter: unknown id"
      );
    });

    it("emits IdentityRevoked, sets revoked=true, clears reverse index", async function () {
      await expect(adapter.connect(registrar).revoke(1n))
        .to.emit(adapter, "IdentityRevoked")
        .withArgs(1n);
      const [, , revoked] = await adapter.getIdentity(1n);
      expect(revoked).to.equal(true);
      expect(await adapter.resolveBySubject(alice.address)).to.equal(0n);
    });

    it("preserves the underlying record for historic reads", async function () {
      await adapter.connect(registrar).revoke(1n);
      const [subject, uri, revoked] = await adapter.getIdentity(1n);
      expect(subject).to.equal(alice.address);
      expect(uri).to.equal(URI_ALICE);
      expect(revoked).to.equal(true);
    });

    it("is idempotent (revoking a revoked id is a no-op)", async function () {
      await adapter.connect(registrar).revoke(1n);
      // Second call must not revert and must not emit IdentityRevoked again.
      const tx = await adapter.connect(registrar).revoke(1n);
      const rcpt = await tx.wait();
      const revokeLogs = rcpt.logs.filter(
        (l) => l.topics[0] === adapter.interface.getEvent("IdentityRevoked").topicHash
      );
      expect(revokeLogs).to.have.length(0);
    });

    it("rotation: revoke + re-register issues a NEW id", async function () {
      await adapter.connect(registrar).revoke(1n);
      await adapter.connect(registrar).register(alice.address, URI_ALICE_V2);
      expect(await adapter.resolveBySubject(alice.address)).to.equal(2n);
      const [, uri] = await adapter.getIdentity(2n);
      expect(uri).to.equal(URI_ALICE_V2);
    });
  });

  describe("getIdentity (unknown id)", function () {
    it("returns zero address and empty string for unknown id (no revert)", async function () {
      const [subject, uri, revoked] = await adapter.getIdentity(99n);
      expect(subject).to.equal(ethers.ZeroAddress);
      expect(uri).to.equal("");
      expect(revoked).to.equal(false);
    });
  });
});
