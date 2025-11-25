
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Decentralized Task Marketplace", function () {
  let project;
  let employer;
  let freelancer;
  let otherUser;

  beforeEach(async function () {
    // Get signers
    [employer, freelancer, otherUser] = await ethers.getSigners();

    // Deploy contract
    const Project = await ethers.getContractFactory("Project");
    project = await Project.deploy();
    await project.deployed();
  });

  describe("Task Creation", function () {
    it("Should create a task with correct details", async function () {
      const reward = ethers.utils.parseEther("1.0");
      const description = "Build a website";

      await expect(
        project.connect(employer).createTask(description, { value: reward })
      )
        .to.emit(project, "TaskCreated")
        .withArgs(1, employer.address, description, reward);

      const task = await project.getTask(1);
      expect(task.id).to.equal(1);
      expect(task.employer).to.equal(employer.address);
      expect(task.description).to.equal(description);
      expect(task.reward).to.equal(reward);
      expect(task.isCompleted).to.equal(false);
      expect(task.isPaid).to.equal(false);
    });

    it("Should fail if reward is zero", async function () {
      await expect(
        project.connect(employer).createTask("Build a website", { value: 0 })
      ).to.be.revertedWith("Reward must be greater than 0");
    });

    it("Should fail if description is empty", async function () {
      const reward = ethers.utils.parseEther("1.0");
      await expect(
        project.connect(employer).createTask("", { value: reward })
      ).to.be.revertedWith("Description cannot be empty");
    });

    it("Should increment task counter", async function () {
      const reward = ethers.utils.parseEther("1.0");
      
      await project.connect(employer).createTask("Task 1", { value: reward });
      expect(await project.taskCounter()).to.equal(1);
      
      await project.connect(employer).createTask("Task 2", { value: reward });
      expect(await project.taskCounter()).to.equal(2);
    });
  });

  describe("Freelancer Assignment", function () {
    beforeEach(async function () {
      const reward = ethers.utils.parseEther("1.0");
      await project.connect(employer).createTask("Build a website", { value: reward });
    });

    it("Should assign freelancer to task", async function () {
      await expect(project.connect(freelancer).assignFreelancer(1))
        .to.emit(project, "TaskAssigned")
        .withArgs(1, freelancer.address);

      const task = await project.getTask(1);
      expect(task.freelancer).to.equal(freelancer.address);
    });

    it("Should fail if task does not exist", async function () {
      await expect(
        project.connect(freelancer).assignFreelancer(999)
      ).to.be.revertedWith("Task does not exist");
    });

    it("Should fail if task already assigned", async function () {
      await project.connect(freelancer).assignFreelancer(1);
      
      await expect(
        project.connect(otherUser).assignFreelancer(1)
      ).to.be.revertedWith("Task already assigned");
    });

    it("Should fail if employer tries to assign themselves", async function () {
      await expect(
        project.connect(employer).assignFreelancer(1)
      ).to.be.revertedWith("Employer cannot be freelancer");
    });
  });

  describe("Task Completion and Payment", function () {
    beforeEach(async function () {
      const reward = ethers.utils.parseEther("1.0");
      await project.connect(employer).createTask("Build a website", { value: reward });
      await project.connect(freelancer).assignFreelancer(1);
    });

    it("Should complete task and release payment", async function () {
      const initialBalance = await ethers.provider.getBalance(freelancer.address);
      const reward = ethers.utils.parseEther("1.0");

      await expect(project.connect(employer).completeTask(1))
        .to.emit(project, "TaskCompleted")
        .withArgs(1)
        .and.to.emit(project, "PaymentReleased")
        .withArgs(1, freelancer.address, reward);

      const task = await project.getTask(1);
      expect(task.isCompleted).to.equal(true);
      expect(task.isPaid).to.equal(true);

      const finalBalance = await ethers.provider.getBalance(freelancer.address);
      expect(finalBalance).to.equal(initialBalance.add(reward));
    });

    it("Should increase freelancer reputation", async function () {
      const initialReputation = await project.getReputation(freelancer.address);
      
      await project.connect(employer).completeTask(1);
      
      const finalReputation = await project.getReputation(freelancer.address);
      expect(finalReputation).to.equal(initialReputation.add(1));
    });

    it("Should fail if non-employer tries to complete task", async function () {
      await expect(
        project.connect(freelancer).completeTask(1)
      ).to.be.revertedWith("Only employer can mark as complete");
    });

    it("Should fail if no freelancer assigned", async function () {
      const reward = ethers.utils.parseEther("1.0");
      await project.connect(employer).createTask("New task", { value: reward });
      
      await expect(
        project.connect(employer).completeTask(2)
      ).to.be.revertedWith("No freelancer assigned");
    });

    it("Should fail if task already completed", async function () {
      await project.connect(employer).completeTask(1);
      
      await expect(
        project.connect(employer).completeTask(1)
      ).to.be.revertedWith("Task already completed");
    });
  });

  describe("Reputation System", function () {
    it("Should track multiple completed tasks", async function () {
      const reward = ethers.utils.parseEther("1.0");
      
      // Create and complete first task
      await project.connect(employer).createTask("Task 1", { value: reward });
      await project.connect(freelancer).assignFreelancer(1);
      await project.connect(employer).completeTask(1);
      
      // Create and complete second task
      await project.connect(employer).createTask("Task 2", { value: reward });
      await project.connect(freelancer).assignFreelancer(2);
      await project.connect(employer).completeTask(2);
      
      const reputation = await project.getReputation(freelancer.address);
      expect(reputation).to.equal(2);
    });

    it("Should have zero reputation initially", async function () {
      const reputation = await project.getReputation(otherUser.address);
      expect(reputation).to.equal(0);
    });
  });

  describe("Contract Balance", function () {
    it("Should hold funds in escrow", async function () {
      const reward = ethers.utils.parseEther("2.0");
      
      await project.connect(employer).createTask("Task 1", { value: reward });
      
      const contractBalance = await ethers.provider.getBalance(project.address);
      expect(contractBalance).to.equal(reward);
    });

    it("Should release all funds after completion", async function () {
      const reward = ethers.utils.parseEther("1.0");
      
      await project.connect(employer).createTask("Task 1", { value: reward });
      await project.connect(freelancer).assignFreelancer(1);
      await project.connect(employer).completeTask(1);
      
      const contractBalance = await ethers.provider.getBalance(project.address);
      expect(contractBalance).to.equal(0);
    });
  });
});
