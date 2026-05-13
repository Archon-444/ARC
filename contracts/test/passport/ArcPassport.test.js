const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Integration: ArcPassport delegating to ArcIdentityAdapter.
 *
 * Covers the W8 verification gate verbatim:
 *   - mint / resolve / revoke happy paths
 *   - role-gated counsel attach
 *   - setIdentityAdapter swap routes subsequent calls to the NEW code
 *   - migration helper path (mintFor used by ProfileRegistry migration)
 */
describe("ArcPassport (W8)", function () {
  let passport, adapter, admin, counsel, alice, bob, mallory;
  let attestationId;

  const URI_ALICE = "ipfs://bafkreialice";
  const URI_BOB = "ipfs://bafkreibob";
  const URI_ALICE_V2 = "ipfs://bafkreialice2";

  const REGISTRAR_ROLE = ethers.id("REGISTRAR_ROLE");
  const COUNSEL_ROLE = ethers.id("COUNSEL_ROLE");

  beforeEach(async function () {
    [admin, counsel, alice, bob, mallory] = await ethers.getSigners();

    const ArcIdentityAdapter = await ethers.getContractFactory("ArcIdentityAdapter");
    adapter = await ArcIdentityAdapter.deploy(admin.address);
    await adapter.waitForDeployment();

    const ArcPassport = await ethers.getContractFactory("ArcPassport");
    passport = await ArcPassport.deploy(admin.address, await adapter.getAddress());
    await passport.waitForDeployment();

    // Grant the Passport contract REGISTRAR_ROLE on the adapter — this
    // is what makes the Passport the sole writer in production.
    await adapter.connect(admin).grantRole(REGISTRAR_ROLE, await passport.getAddress());

    // Grant COUNSEL_ROLE for the counsel-attach tests.
    await passport.connect(admin).grantRole(COUNSEL_ROLE, counsel.address);

    attestationId = ethers.id("counsel.kyb.v1:alice:2026-01-12");
  });

  describe("constructor", function () {
    it("reverts on zero admin", async function () {
      const ArcPassport = await ethers.getContractFactory("ArcPassport");
      await expect(
        ArcPassport.deploy(ethers.ZeroAddress, await adapter.getAddress())
      ).to.be.revertedWith("ArcPassport: admin=0");
    });

    it("reverts on zero adapter", async function () {
      const ArcPassport = await ethers.getContractFactory("ArcPassport");
      await expect(ArcPassport.deploy(admin.address, ethers.ZeroAddress)).to.be.revertedWith(
        "ArcPassport: adapter=0"
      );
    });

    it("emits IdentityAdapterUpdated on deploy (previous=0, next=adapter)", async function () {
      const ArcPassport = await ethers.getContractFactory("ArcPassport");
      const addr = await adapter.getAddress();
      const deploy = await ArcPassport.deploy(admin.address, addr);
      const rcpt = await deploy.deploymentTransaction().wait();
      const event = rcpt.logs
        .map((l) => {
          try {
            return deploy.interface.parseLog(l);
          } catch {
            return null;
          }
        })
        .filter((e) => e && e.name === "IdentityAdapterUpdated")[0];
      expect(event).to.exist;
      expect(event.args.previous).to.equal(ethers.ZeroAddress);
      expect(event.args.next).to.equal(addr);
    });
  });

  describe("mintSelf", function () {
    it("issues a passport for msg.sender and emits PassportMinted", async function () {
      await expect(passport.connect(alice).mintSelf(URI_ALICE))
        .to.emit(passport, "PassportMinted")
        .withArgs(1n, alice.address, URI_ALICE);

      expect(await passport.resolveBySubject(alice.address)).to.equal(1n);
      const [subject, uri, revoked, counselId] = await passport.getPassport(1n);
      expect(subject).to.equal(alice.address);
      expect(uri).to.equal(URI_ALICE);
      expect(revoked).to.equal(false);
      expect(counselId).to.equal(ethers.ZeroHash);
    });

    it("rejects mintSelf if caller already has an active passport", async function () {
      await passport.connect(alice).mintSelf(URI_ALICE);
      await expect(passport.connect(alice).mintSelf(URI_ALICE_V2)).to.be.revertedWith(
        "ArcIdentityAdapter: already registered"
      );
    });

    it("allows mintSelf after the caller revokes their passport (rotation)", async function () {
      await passport.connect(alice).mintSelf(URI_ALICE);
      await passport.connect(alice).revoke(1n);
      await expect(passport.connect(alice).mintSelf(URI_ALICE_V2))
        .to.emit(passport, "PassportMinted")
        .withArgs(2n, alice.address, URI_ALICE_V2);
      expect(await passport.resolveBySubject(alice.address)).to.equal(2n);
    });
  });

  describe("mintFor (admin / migration helper)", function () {
    it("admin can mint a passport for another subject", async function () {
      await expect(passport.connect(admin).mintFor(alice.address, URI_ALICE))
        .to.emit(passport, "PassportMinted")
        .withArgs(1n, alice.address, URI_ALICE);
      expect(await passport.resolveBySubject(alice.address)).to.equal(1n);
    });

    it("rejects non-admin callers", async function () {
      await expect(passport.connect(mallory).mintFor(alice.address, URI_ALICE)).to.be.reverted;
    });
  });

  describe("updateMetadata", function () {
    beforeEach(async function () {
      await passport.connect(alice).mintSelf(URI_ALICE);
    });

    it("subject can update their own URI", async function () {
      await expect(passport.connect(alice).updateMetadata(1n, URI_ALICE_V2))
        .to.emit(passport, "PassportMetadataUpdated")
        .withArgs(1n, URI_ALICE_V2);
      const [, uri] = await passport.getPassport(1n);
      expect(uri).to.equal(URI_ALICE_V2);
    });

    it("non-subject (even admin) cannot update", async function () {
      await expect(
        passport.connect(admin).updateMetadata(1n, URI_ALICE_V2)
      ).to.be.revertedWith("ArcPassport: not subject");
    });

    it("rejects unknown passport", async function () {
      await expect(
        passport.connect(alice).updateMetadata(99n, URI_ALICE_V2)
      ).to.be.revertedWith("ArcPassport: unknown");
    });

    it("rejects update on revoked passport", async function () {
      await passport.connect(alice).revoke(1n);
      await expect(
        passport.connect(alice).updateMetadata(1n, URI_ALICE_V2)
      ).to.be.revertedWith("ArcPassport: revoked");
    });
  });

  describe("revoke", function () {
    beforeEach(async function () {
      await passport.connect(alice).mintSelf(URI_ALICE);
    });

    it("subject can revoke their own passport", async function () {
      await expect(passport.connect(alice).revoke(1n))
        .to.emit(passport, "PassportRevoked")
        .withArgs(1n);
      const [, , revoked] = await passport.getPassport(1n);
      expect(revoked).to.equal(true);
      expect(await passport.resolveBySubject(alice.address)).to.equal(0n);
    });

    it("admin can revoke any passport", async function () {
      await expect(passport.connect(admin).revoke(1n))
        .to.emit(passport, "PassportRevoked")
        .withArgs(1n);
    });

    it("non-subject non-admin cannot revoke", async function () {
      await expect(passport.connect(mallory).revoke(1n)).to.be.revertedWith(
        "ArcPassport: not authorized"
      );
    });

    it("clears any attached counsel attestation on revoke", async function () {
      await passport.connect(counsel).attachCounselAttestation(1n, attestationId);
      let [, , , counselId] = await passport.getPassport(1n);
      expect(counselId).to.equal(attestationId);

      await passport.connect(alice).revoke(1n);
      [, , , counselId] = await passport.getPassport(1n);
      expect(counselId).to.equal(ethers.ZeroHash);
    });

    it("is idempotent (revoking a revoked passport is a no-op)", async function () {
      await passport.connect(alice).revoke(1n);
      const tx = await passport.connect(alice).revoke(1n);
      const rcpt = await tx.wait();
      const revokeLogs = rcpt.logs.filter(
        (l) => l.topics[0] === passport.interface.getEvent("PassportRevoked").topicHash
      );
      expect(revokeLogs).to.have.length(0);
    });
  });

  describe("attachCounselAttestation", function () {
    beforeEach(async function () {
      await passport.connect(alice).mintSelf(URI_ALICE);
    });

    it("counsel role can attach", async function () {
      await expect(passport.connect(counsel).attachCounselAttestation(1n, attestationId))
        .to.emit(passport, "CounselAttestationAttached")
        .withArgs(1n, attestationId, counsel.address);
      const [, , , counselId] = await passport.getPassport(1n);
      expect(counselId).to.equal(attestationId);
    });

    it("non-counsel (even admin, even subject) cannot attach", async function () {
      await expect(passport.connect(admin).attachCounselAttestation(1n, attestationId)).to.be
        .reverted;
      await expect(passport.connect(alice).attachCounselAttestation(1n, attestationId)).to.be
        .reverted;
    });

    it("rejects attestationId=0", async function () {
      await expect(
        passport.connect(counsel).attachCounselAttestation(1n, ethers.ZeroHash)
      ).to.be.revertedWith("ArcPassport: attestationId=0");
    });

    it("rejects attach on unknown passport", async function () {
      await expect(
        passport.connect(counsel).attachCounselAttestation(99n, attestationId)
      ).to.be.revertedWith("ArcPassport: unknown");
    });

    it("rejects attach on revoked passport", async function () {
      await passport.connect(alice).revoke(1n);
      await expect(
        passport.connect(counsel).attachCounselAttestation(1n, attestationId)
      ).to.be.revertedWith("ArcPassport: revoked");
    });

    it("re-attach overwrites and emits a fresh event", async function () {
      await passport.connect(counsel).attachCounselAttestation(1n, attestationId);
      const newId = ethers.id("counsel.kyb.v1:alice:2026-04-01");
      await expect(passport.connect(counsel).attachCounselAttestation(1n, newId))
        .to.emit(passport, "CounselAttestationAttached")
        .withArgs(1n, newId, counsel.address);
      const [, , , counselId] = await passport.getPassport(1n);
      expect(counselId).to.equal(newId);
    });
  });

  describe("setIdentityAdapter (adapter swap)", function () {
    let adapter2;

    beforeEach(async function () {
      // Mint into the old adapter so we can prove the swap doesn't
      // migrate state.
      await passport.connect(alice).mintSelf(URI_ALICE);

      const ArcIdentityAdapter = await ethers.getContractFactory("ArcIdentityAdapter");
      adapter2 = await ArcIdentityAdapter.deploy(admin.address);
      await adapter2.waitForDeployment();
      await adapter2.connect(admin).grantRole(REGISTRAR_ROLE, await passport.getAddress());
    });

    it("non-admin cannot swap", async function () {
      await expect(passport.connect(mallory).setIdentityAdapter(await adapter2.getAddress())).to.be
        .reverted;
    });

    it("rejects zero adapter", async function () {
      await expect(
        passport.connect(admin).setIdentityAdapter(ethers.ZeroAddress)
      ).to.be.revertedWith("ArcPassport: adapter=0");
    });

    it("emits IdentityAdapterUpdated with previous + next", async function () {
      const prev = await passport.identityAdapter();
      const next = await adapter2.getAddress();
      await expect(passport.connect(admin).setIdentityAdapter(next))
        .to.emit(passport, "IdentityAdapterUpdated")
        .withArgs(prev, next);
      expect(await passport.identityAdapter()).to.equal(next);
    });

    it("subsequent calls route to the NEW adapter", async function () {
      // Pre-swap: Bob has no passport.
      expect(await passport.resolveBySubject(bob.address)).to.equal(0n);

      // Swap.
      await passport.connect(admin).setIdentityAdapter(await adapter2.getAddress());

      // Mint Bob into the new adapter. It should issue id=1 since
      // adapter2 is fresh — proving the call hit adapter2, not the
      // original (which would have issued id=2).
      await passport.connect(bob).mintSelf(URI_BOB);
      expect(await passport.resolveBySubject(bob.address)).to.equal(1n);

      // The first adapter still has alice; reads through the Passport
      // now hit adapter2, so alice no longer resolves through the
      // Passport surface (her record lives on the abandoned adapter).
      expect(await passport.resolveBySubject(alice.address)).to.equal(0n);
    });

    it("counsel attestations are preserved across swaps (stored on Passport, not adapter)", async function () {
      await passport.connect(counsel).attachCounselAttestation(1n, attestationId);
      await passport.connect(admin).setIdentityAdapter(await adapter2.getAddress());
      expect(await passport.counselAttestations(1n)).to.equal(attestationId);
    });
  });

  describe("getPassport (unknown id)", function () {
    it("returns zero values without revert", async function () {
      const [subject, uri, revoked, counselId] = await passport.getPassport(42n);
      expect(subject).to.equal(ethers.ZeroAddress);
      expect(uri).to.equal("");
      expect(revoked).to.equal(false);
      expect(counselId).to.equal(ethers.ZeroHash);
    });
  });
});
