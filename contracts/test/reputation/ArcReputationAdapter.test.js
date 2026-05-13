const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * ArcReputationAdapter behavior tests (W9).
 *
 * Coverage:
 *   - constructor: zero-admin reject, DEFAULT_ADMIN_ROLE grant.
 *   - postFeedback: FEEDBACK_ROLE gate, validation (subject!=0,
 *     dataHash!=0, sentiment in [-100,100]), deterministic id
 *     derivation (subject + signer + dataHash + nonce), event
 *     emission, per-subject append-only history, per-signer
 *     monotonic nonce.
 *   - getFeedback / feedbackCount / feedbackAt: read paths and
 *     pagination invariants.
 *   - append-only contract: posting feedback again with same body
 *     hash but new nonce produces a DIFFERENT id (no overwrite).
 */
describe("ArcReputationAdapter (W9)", function () {
  let adapter, admin, signer1, signer2, subject, other;
  const FEEDBACK_ROLE = ethers.id("FEEDBACK_ROLE");
  const DH1 = ethers.id("counsel.kyb.v1:body-1");
  const DH2 = ethers.id("counsel.kyb.v1:body-2");

  beforeEach(async function () {
    [admin, signer1, signer2, subject, other] = await ethers.getSigners();
    const ArcReputationAdapter = await ethers.getContractFactory("ArcReputationAdapter");
    adapter = await ArcReputationAdapter.deploy(admin.address);
    await adapter.waitForDeployment();
    await adapter.connect(admin).grantRole(FEEDBACK_ROLE, signer1.address);
    await adapter.connect(admin).grantRole(FEEDBACK_ROLE, signer2.address);
  });

  describe("constructor", function () {
    it("reverts on zero admin", async function () {
      const ArcReputationAdapter = await ethers.getContractFactory("ArcReputationAdapter");
      await expect(ArcReputationAdapter.deploy(ethers.ZeroAddress)).to.be.revertedWith(
        "ArcReputationAdapter: admin=0"
      );
    });

    it("grants DEFAULT_ADMIN_ROLE to admin", async function () {
      expect(await adapter.hasRole(await adapter.DEFAULT_ADMIN_ROLE(), admin.address)).to.equal(
        true
      );
    });
  });

  describe("postFeedback", function () {
    it("rejects callers without FEEDBACK_ROLE", async function () {
      await expect(adapter.connect(other).postFeedback(subject.address, DH1, 50)).to.be.reverted;
    });

    it("rejects subject=0", async function () {
      await expect(
        adapter.connect(signer1).postFeedback(ethers.ZeroAddress, DH1, 50)
      ).to.be.revertedWith("ArcReputationAdapter: subject=0");
    });

    it("rejects dataHash=0", async function () {
      await expect(
        adapter.connect(signer1).postFeedback(subject.address, ethers.ZeroHash, 50)
      ).to.be.revertedWith("ArcReputationAdapter: dataHash=0");
    });

    it("rejects sentiment > 100", async function () {
      await expect(
        adapter.connect(signer1).postFeedback(subject.address, DH1, 101)
      ).to.be.revertedWith("ArcReputationAdapter: sentiment out of range");
    });

    it("rejects sentiment < -100", async function () {
      await expect(
        adapter.connect(signer1).postFeedback(subject.address, DH1, -101)
      ).to.be.revertedWith("ArcReputationAdapter: sentiment out of range");
    });

    it("accepts sentiment boundaries -100 and 100", async function () {
      await expect(adapter.connect(signer1).postFeedback(subject.address, DH1, -100)).to.emit(
        adapter,
        "FeedbackPosted"
      );
      await expect(adapter.connect(signer1).postFeedback(subject.address, DH2, 100)).to.emit(
        adapter,
        "FeedbackPosted"
      );
    });

    it("derives id deterministically from (subject, signer, dataHash, nonce)", async function () {
      const nonce = await adapter.nextNonce(signer1.address);
      const expectedId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "address", "bytes32", "uint256"],
          [subject.address, signer1.address, DH1, nonce]
        )
      );
      await expect(adapter.connect(signer1).postFeedback(subject.address, DH1, 75))
        .to.emit(adapter, "FeedbackPosted")
        .withArgs(expectedId, subject.address, signer1.address, 75, DH1);
    });

    it("two posts by the same signer with identical body produce DIFFERENT ids", async function () {
      const tx1 = await adapter.connect(signer1).postFeedback(subject.address, DH1, 50);
      const tx2 = await adapter.connect(signer1).postFeedback(subject.address, DH1, 50);
      const r1 = await tx1.wait();
      const r2 = await tx2.wait();
      const id1 = r1.logs[0].topics[1];
      const id2 = r2.logs[0].topics[1];
      expect(id1).to.not.equal(id2);
    });

    it("advances the per-signer nonce on every post", async function () {
      expect(await adapter.nextNonce(signer1.address)).to.equal(0n);
      await adapter.connect(signer1).postFeedback(subject.address, DH1, 10);
      expect(await adapter.nextNonce(signer1.address)).to.equal(1n);
      await adapter.connect(signer1).postFeedback(subject.address, DH2, -10);
      expect(await adapter.nextNonce(signer1.address)).to.equal(2n);
      // Other signer's nonce is independent.
      expect(await adapter.nextNonce(signer2.address)).to.equal(0n);
    });

    it("stores the feedback record correctly", async function () {
      await adapter.connect(signer1).postFeedback(subject.address, DH1, 42);
      const id = await adapter.feedbackAt(subject.address, 0);
      const [s, sg, dh, sent, ts] = await adapter.getFeedback(id);
      expect(s).to.equal(subject.address);
      expect(sg).to.equal(signer1.address);
      expect(dh).to.equal(DH1);
      expect(sent).to.equal(42);
      expect(ts).to.be.gt(0n);
    });
  });

  describe("feedbackCount / feedbackAt", function () {
    it("starts at 0 for an unseen subject", async function () {
      expect(await adapter.feedbackCount(subject.address)).to.equal(0n);
    });

    it("increments per post and exposes ids by index", async function () {
      const tx1 = await adapter.connect(signer1).postFeedback(subject.address, DH1, 50);
      const tx2 = await adapter.connect(signer2).postFeedback(subject.address, DH2, -25);
      const r1 = await tx1.wait();
      const r2 = await tx2.wait();
      const id1 = r1.logs[0].topics[1];
      const id2 = r2.logs[0].topics[1];

      expect(await adapter.feedbackCount(subject.address)).to.equal(2n);
      expect(await adapter.feedbackAt(subject.address, 0)).to.equal(id1);
      expect(await adapter.feedbackAt(subject.address, 1)).to.equal(id2);
    });

    it("reverts on out-of-bounds index", async function () {
      await expect(adapter.feedbackAt(subject.address, 0)).to.be.revertedWith(
        "ArcReputationAdapter: index oob"
      );
    });

    it("counts are per-subject (different subjects are independent)", async function () {
      await adapter.connect(signer1).postFeedback(subject.address, DH1, 10);
      await adapter.connect(signer1).postFeedback(other.address, DH2, -10);
      expect(await adapter.feedbackCount(subject.address)).to.equal(1n);
      expect(await adapter.feedbackCount(other.address)).to.equal(1n);
    });
  });

  describe("append-only history", function () {
    it("getFeedback on an unknown id returns zero values (no revert)", async function () {
      const unknown = ethers.id("nothing");
      const [s, sg, dh, sent, ts] = await adapter.getFeedback(unknown);
      expect(s).to.equal(ethers.ZeroAddress);
      expect(sg).to.equal(ethers.ZeroAddress);
      expect(dh).to.equal(ethers.ZeroHash);
      expect(sent).to.equal(0);
      expect(ts).to.equal(0n);
    });

    it("posting opposite-sentiment retraction does NOT mutate the original", async function () {
      // Original positive feedback.
      const tx1 = await adapter.connect(signer1).postFeedback(subject.address, DH1, 80);
      const r1 = await tx1.wait();
      const id1 = r1.logs[0].topics[1];

      // "Retraction" with negative sentiment, same subject.
      await adapter.connect(signer1).postFeedback(subject.address, DH2, -80);

      // Original still readable, unchanged.
      const [, , , sent1] = await adapter.getFeedback(id1);
      expect(sent1).to.equal(80);
      expect(await adapter.feedbackCount(subject.address)).to.equal(2n);
    });
  });
});
