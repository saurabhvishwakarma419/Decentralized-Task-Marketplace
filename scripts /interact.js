
const hre = require("hardhat");

async function main() {
  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";

  console.log("Interacting with Decentralized Task Marketplace...\n");

  // Get signers
  const [employer, freelancer] = await ethers.getSigners();
  console.log("Employer address:", employer.address);
  console.log("Freelancer address:", freelancer.address, "\n");

  // Get contract instance
  const Project = await hre.ethers.getContractFactory("Project");
  const project = Project.attach(CONTRACT_ADDRESS);

  console.log("Connected to contract at:", project.address, "\n");

  // ============================================
  // 1. CREATE A TASK
  // ============================================
  console.log("=================================================");
  console.log("Step 1: Creating a task...");
  console.log("=================================================");
  
  const taskDescription = "Build a decentralized voting application";
  const reward = ethers.utils.parseEther("2.5"); // 2.5 ETH

  const createTx = await project.connect(employer).createTask(taskDescription, {
    value: reward,
  });
  await createTx.wait();
  
  console.log("✅ Task created successfully!");
  console.log("Transaction hash:", createTx.hash);

  const taskCounter = await project.taskCounter();
  console.log("Current task ID:", taskCounter.toString(), "\n");

  // ============================================
  // 2. VIEW TASK DETAILS
  // ============================================
  console.log("=================================================");
  console.log("Step 2: Viewing task details...");
  console.log("=================================================");

  const task = await project.getTask(taskCounter);
  console.log("Task ID:", task.id.toString());
  console.log("Employer:", task.employer);
  console.log("Freelancer:", task.freelancer);
  console.log("Description:", task.description);
  console.log("Reward:", ethers.utils.formatEther(task.reward), "ETH");
  console.log("Completed:", task.isCompleted);
  console.log("Paid:", task.isPaid, "\n");

  // ============================================
  // 3. ASSIGN FREELANCER
  // ============================================
  console.log("=================================================");
  console.log("Step 3: Assigning freelancer to task...");
  console.log("=================================================");

  const assignTx = await project.connect(freelancer).assignFreelancer(taskCounter);
  await assignTx.wait();
  
  console.log("✅ Freelancer assigned successfully!");
  console.log("Transaction hash:", assignTx.hash, "\n");

  // ============================================
  // 4. VIEW UPDATED TASK
  // ============================================
  console.log("=================================================");
  console.log("Step 4: Viewing updated task...");
  console.log("=================================================");

  const updatedTask = await project.getTask(taskCounter);
  console.log("Task ID:", updatedTask.id.toString());
  console.log("Assigned Freelancer:", updatedTask.freelancer);
  console.log("Status: Freelancer assigned ✓\n");

  // ============================================
  // 5. CHECK FREELANCER BALANCE (BEFORE)
  // ============================================
  console.log("=================================================");
  console.log("Step 5: Checking freelancer balance (before)...");
  console.log("=================================================");

  const balanceBefore = await ethers.provider.getBalance(freelancer.address);
  console.log("Freelancer balance:", ethers.utils.formatEther(balanceBefore), "ETH\n");

  // ============================================
  // 6. COMPLETE TASK & RELEASE PAYMENT
  // ============================================
  console.log("=================================================");
  console.log("Step 6: Completing task and releasing payment...");
  console.log("=================================================");

  const completeTx = await project.connect(employer).completeTask(taskCounter);
  await completeTx.wait();
  
  console.log("✅ Task completed and payment released!");
  console.log("Transaction hash:", completeTx.hash, "\n");

  // ============================================
  // 7. CHECK FREELANCER BALANCE (AFTER)
  // ============================================
  console.log("=================================================");
  console.log("Step 7: Checking freelancer balance (after)...");
  console.log("=================================================");

  const balanceAfter = await ethers.provider.getBalance(freelancer.address);
  console.log("Freelancer balance:", ethers.utils.formatEther(balanceAfter), "ETH");
  
  const earned = balanceAfter.sub(balanceBefore);
  console.log("Amount earned:", ethers.utils.formatEther(earned), "ETH\n");

  // ============================================
  // 8. CHECK REPUTATION
  // ============================================
  console.log("=================================================");
  console.log("Step 8: Checking freelancer reputation...");
  console.log("=================================================");

  const reputation = await project.getReputation(freelancer.address);
  console.log("Freelancer reputation score:", reputation.toString());
  console.log("Tasks completed:", reputation.toString(), "\n");

  // ============================================
  // 9. FINAL TASK STATUS
  // ============================================
  console.log("=================================================");
  console.log("Step 9: Final task status...");
  console.log("=================================================");

  const finalTask = await project.getTask(taskCounter);
  console.log("Task completed:", finalTask.isCompleted);
  console.log("Payment released:", finalTask.isPaid);
  console.log("\n✅ All operations completed successfully!\n");

  // ============================================
  // CONTRACT SUMMARY
  // ============================================
  console.log("=================================================");
  console.log("Contract Summary");
  console.log("=================================================");
  console.log("Total tasks created:", (await project.taskCounter()).toString());
  console.log("Contract address:", project.address);
  console.log("Network:", hre.network.name);
  console.log("=================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
