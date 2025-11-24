// Connect Wallet
const connectWalletBtn = document.getElementById("connectWalletBtn");

connectWalletBtn.addEventListener("click", async () => {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      connectWalletBtn.innerText = "Wallet Connected";
      connectWalletBtn.disabled = true;
    } catch (error) {
      console.log("Wallet connection error:", error);
    }
  } else {
    alert("Metamask not detected. Please install it!");
  }
});

// Add Task to the List
const createTaskBtn = document.getElementById("createTaskBtn");
const tasksContainer = document.getElementById("tasks");

createTaskBtn.addEventListener("click", () => {
  const title = document.getElementById("taskTitle").value;
  const description = document.getElementById("taskDescription").value;
  const reward = document.getElementById("rewardAmount").value;

  if (!title || !description || !reward) {
    alert("Please fill out all fields!");
    return;
  }

  const taskDiv = document.createElement("div");
  taskDiv.className = "task-item";
  taskDiv.innerHTML = `
    <h3>${title}</h3>
    <p>${description}</p>
    <strong>Reward: ${reward} ETH</strong>
    <button class="applyBtn">Apply</button>
  `;

  tasksContainer.appendChild(taskDiv);

  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("rewardAmount").value = "";
});

