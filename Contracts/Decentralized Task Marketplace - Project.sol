
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Project {
    struct Task {
        uint256 id;
        address employer;
        address freelancer;
        string description;
        uint256 reward;
        bool isCompleted;
        bool isPaid;
        uint256 createdAt;
    }

    uint256 public taskCounter;
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256) public userReputation;

    event TaskCreated(uint256 indexed taskId, address indexed employer, string description, uint256 reward);
    event TaskAssigned(uint256 indexed taskId, address indexed freelancer);
    event TaskCompleted(uint256 indexed taskId);
    event PaymentReleased(uint256 indexed taskId, address indexed freelancer, uint256 amount);

    // Core Function 1: Create a new task with escrow
    function createTask(string memory _description) external payable {
        require(msg.value > 0, "Reward must be greater than 0");
        require(bytes(_description).length > 0, "Description cannot be empty");

        taskCounter++;
        tasks[taskCounter] = Task({
            id: taskCounter,
            employer: msg.sender,
            freelancer: address(0),
            description: _description,
            reward: msg.value,
            isCompleted: false,
            isPaid: false,
            createdAt: block.timestamp
        });

        emit TaskCreated(taskCounter, msg.sender, _description, msg.value);
    }

    // Core Function 2: Assign freelancer to task
    function assignFreelancer(uint256 _taskId) external {
        Task storage task = tasks[_taskId];
        require(task.id != 0, "Task does not exist");
        require(task.freelancer == address(0), "Task already assigned");
        require(task.employer != msg.sender, "Employer cannot be freelancer");
        require(!task.isCompleted, "Task already completed");

        task.freelancer = msg.sender;
        emit TaskAssigned(_taskId, msg.sender);
    }

    // Core Function 3: Complete task and release payment
    function completeTask(uint256 _taskId) external {
        Task storage task = tasks[_taskId];
        require(task.id != 0, "Task does not exist");
        require(task.employer == msg.sender, "Only employer can mark as complete");
        require(task.freelancer != address(0), "No freelancer assigned");
        require(!task.isCompleted, "Task already completed");
        require(!task.isPaid, "Payment already released");

        task.isCompleted = true;
        task.isPaid = true;

        // Increase freelancer reputation
        userReputation[task.freelancer]++;

        // Transfer payment to freelancer
        payable(task.freelancer).transfer(task.reward);

        emit TaskCompleted(_taskId);
        emit PaymentReleased(_taskId, task.freelancer, task.reward);
    }

    // Helper function: Get task details
    function getTask(uint256 _taskId) external view returns (
        uint256 id,
        address employer,
        address freelancer,
        string memory description,
        uint256 reward,
        bool isCompleted,
        bool isPaid
    ) {
        Task memory task = tasks[_taskId];
        return (
            task.id,
            task.employer,
            task.freelancer,
            task.description,
            task.reward,
            task.isCompleted,
            task.isPaid
        );
    }

    // Helper function: Get user reputation score
    function getReputation(address _user) external view returns (uint256) {
        return userReputation[_user];
    }
}

