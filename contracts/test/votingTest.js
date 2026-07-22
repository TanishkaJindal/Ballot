let Voting;
let votingContract;

beforeEach(async function () {
//deployment of ElectionManager

 ElectionManager = await ethers.getContractFactory("ElectionManager");
    ElectionManagerContract = await ElectionManager.deploy();


    //deployment of voting contract
    Voting = await ethers.getContractFactory("Voting");

    votingContract = await Voting.deploy(
        ElectionManagerContract.target
    );

    await ElectionManagerContract.setVotingContract(
        votingContract.target
    );
});