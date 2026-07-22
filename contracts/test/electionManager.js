const {expect} = require("chai");
const {ethers} = require("hardhat");
let admin1;
let addr1;
let addr2;
let addrs;
let contract;
let owner;
let  ElectionManagerContract;
                                    
let Voting;
let votingContract;

describe("ElectionManager" , function() {
    beforeEach(async function (){

        [owner , admin1 ,addr1 ,addr2 ,...addrs] = await ethers.getSigners();
//deployment of ElectionManager
         contract =  await ethers.getContractFactory("ElectionManager");
         ElectionManagerContract =  await contract.deploy();
       
    })

    describe("deployment" , function(){
it("should set  contract deployer as owner", async function(){
    expect(await ElectionManagerContract.owner()).to.equal(owner.address);
})

it("should set  contract deployer/owner as admin", async function(){
    expect(await ElectionManagerContract.admins(owner.address)).to.equal(true);
})

it("electionCount should  be initialized with 0" , async function(){
    
    expect( await ElectionManagerContract.electionCount()).to.equal(0);
    
})
it(" votingContract should be initialized with initial address as zero " , async function(){
    
    
     expect( await ElectionManagerContract.votingContract()).to.equal(ethers.ZeroAddress);
})
    })

describe("addAdmin" , function(){
    
    it("should allow owner to add admin and update state",async function() {

        expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(false);
        await ElectionManagerContract.addAdmin(addr1.address);

expect(await ElectionManagerContract.admins(addr1.address)).to.equal(true);
    })

    it("AdminAdded event emitted",async function() {
         await expect(ElectionManagerContract.addAdmin(addr1.address)).to.emit(ElectionManagerContract ,"AdminAdded").withArgs(addr1.address);
    })

    it("should not allow non-owner to add admin",async function() {
        
        expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(false);
        await expect(ElectionManagerContract.connect(admin1).addAdmin(addr1.address)).to.be.revertedWithCustomError(ElectionManagerContract,"NotOwner") ;

      expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(false);
})
})

it("Adding an already added admin should not change state",async function(){
     await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);

// add again 
 await ElectionManagerContract.addAdmin(addr1.address);
 //state check
expect(await ElectionManagerContract.admins(addr1.address)).to.equal(true);
})

describe("removeAdmin" , function(){
    
    it("should allow owner to remove admin and update state",async function() {

        await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);

  await ElectionManagerContract.removeAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.equal(false);
    })

    it(" AdminRemoved event emitted",async function() {

         await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);

         await expect(ElectionManagerContract.removeAdmin(addr1.address)).to.emit(ElectionManagerContract ,"AdminRemoved").withArgs(addr1.address);
    })

    it(" after calling removeAdmin function ,admin mapping  should become false",async function() {
         await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);

await ElectionManagerContract.removeAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(false);
    })

    it("Non-owner cannot remove admin and state remains unchanged after failed removal",async function() {
        await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);

        await expect(ElectionManagerContract.connect(addr2).removeAdmin(addr1.address)).to.be.revertedWithCustomError(ElectionManagerContract,"NotOwner") ;
        expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
    })
})

it("Removing an already removed admin should not change state",async function(){
     await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);

  await ElectionManagerContract.removeAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.equal(false);

// remove again 
 await ElectionManagerContract.removeAdmin(addr1.address);
 //state check
expect(await ElectionManagerContract.admins(addr1.address)).to.equal(false);
})

describe("createElection" , function(){

    it("Admin should be able to create election and there should be increment in election count ",async function(){

        await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);

const initialElectionCount = await ElectionManagerContract.electionCount();

const currentTime = (await ethers.provider.getBlock("latest")).timestamp;

const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );

     expect(await ElectionManagerContract.electionCount()).to.equal(initialElectionCount + 1n);
})
 
it("Election ID returned correctly.",async function(){

     const currentTime = (await ethers.provider.getBlock("latest")).timestamp;

const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

  const InitialElectionCount = await ElectionManagerContract.electionCount();
  const ElectionId = InitialElectionCount + 1n ;
const ElectionName = "Club President Election" ;

await ElectionManagerContract.createElection( ElectionName , startTime, endTime);
expect(
    await ElectionManagerContract.electionCount()
).to.equal(ElectionId);

})

it("Election data stored correctly",async function(){

    const currentTime = (await ethers.provider.getBlock("latest")).timestamp;

const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

const ElectionName = "College club President Election" ;

await ElectionManagerContract.createElection( ElectionName , startTime, endTime);

const electionId =
    await ElectionManagerContract.electionCount();

const [name, startTiming, endTiming,phase, candidateCount,creator] = await ElectionManagerContract.getElection(electionId);

expect(ElectionName).to.equal(name);
expect(startTiming).to.equal(startTime);
expect(endTiming).to.equal(endTime);
expect(phase).to.equal(0);
expect(candidateCount).to.equal(0);
expect(creator).to.equal(owner.address);
 })


it("should be in setup phase",async function(){
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;

const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

const ElectionName = "Club President Election" ;

await ElectionManagerContract.createElection( ElectionName , startTime, endTime);

const electionId =
    await ElectionManagerContract.electionCount();

const [ , , ,phase, ,] = await ElectionManagerContract.getElection(electionId);
expect(phase).to.equal(0);

 })

it("Election event emitted",async function(){
 
    const currentTime =(await ethers.provider.getBlock("latest")).timestamp;

const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

  const InitialElectionCount = await ElectionManagerContract.electionCount();
  const ElectionId = InitialElectionCount + 1n ;
const ElectionName = "Club President Election" ;

     await expect(ElectionManagerContract.createElection( ElectionName , startTime, endTime)).to.emit(ElectionManagerContract, "ElectionCreated").withArgs(ElectionId , ElectionName , startTime, endTime)

})

 it("Non-admin cannot create election",async function(){
const currentTime =(await ethers.provider.getBlock("latest")).timestamp;

const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

  const InitialElectionCount = await ElectionManagerContract.electionCount();
  const ElectionId = InitialElectionCount + 1n ;
const ElectionName = "Club Election" ;
// currently address2 is not admin 
await expect(ElectionManagerContract.connect(addr2).createElection(ElectionName , startTime, endTime)).to.be.revertedWithCustomError( ElectionManagerContract,"NotAdmin") ;
  })

 it("Invalid timestamps revert",async function(){
const currentTime =(await ethers.provider.getBlock("latest")).timestamp;

const startTime = currentTime + 3600;     // 1 hour later
const endTime = currentTime + 60;     // 1 min later

await expect(ElectionManagerContract.createElection("election",startTime,endTime)).to.be.revertedWithCustomError(ElectionManagerContract,"InvalidTimeWindow");
  })

 it("Multiple elections created sequentially",async function(){
  await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);

const initialElectionCount = await ElectionManagerContract.electionCount();

const currentTime = (await ethers.provider.getBlock("latest")).timestamp;

const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

    const Election1 = await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
   const electionId1 = initialElectionCount +1n ;
 expect(await ElectionManagerContract.electionCount()).to.equal(electionId1);

    const Election2 = await ElectionManagerContract.connect(addr1).createElection("PR team", startTime + 60 , endTime -1800 );
     const electionId2 = initialElectionCount + 2n ;
 expect(await ElectionManagerContract.electionCount()).to.equal(electionId2);

 const election1 =await ElectionManagerContract.getElection(electionId1);

    const election2 = await ElectionManagerContract.getElection(electionId2);

 expect(election1[0]).to.equal("studentLeader");

    expect(election2[0]).to.equal("PR team");
  })

})

describe("startElection",function(){

    it("admin starts election and phase becomes Active and should revert for wrong phase", async function(){
 await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     expect(await ElectionManagerContract.electionCount()).to.equal(ElectionId);

await ElectionManagerContract.connect(addr1).startElection(ElectionId) ;
const [ , , , phase , , ] = await ElectionManagerContract.getElection(ElectionId);

expect(phase).to.equal(1);

    })
    
    it("ElectionStarted event emitted", async function(){

 await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     expect(await ElectionManagerContract.electionCount()).to.equal(ElectionId);

await expect(ElectionManagerContract.connect(addr1).startElection(ElectionId)).to.emit(ElectionManagerContract ,"ElectionStarted").withArgs(ElectionId)
    })

    it("non-admin cannot start election", async function(){
         await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     expect(await ElectionManagerContract.electionCount()).to.equal(ElectionId);

await expect(ElectionManagerContract.connect(addr2).startElection(ElectionId)).to.be.revertedWithCustomError(ElectionManagerContract,"NotAdmin") ;

    })

  
    
it("cannot start already active election", async function () {

     await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     expect(await ElectionManagerContract.electionCount()).to.equal(ElectionId);

   await ElectionManagerContract.startElection(ElectionId);

   await expect(
      ElectionManagerContract.startElection(ElectionId)
   ).to.be.revertedWithCustomError(
      ElectionManagerContract,
      "WrongPhase"
   );
});
    
    
    it("cannot start already ended election", async function(){
await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     expect(await ElectionManagerContract.electionCount()).to.equal(ElectionId);

   await ElectionManagerContract.startElection(ElectionId);
await ElectionManagerContract.endElection(ElectionId);
   await expect(
      ElectionManagerContract.startElection(ElectionId)
   ).to.be.revertedWithCustomError(
      ElectionManagerContract,
      "WrongPhase"
   );
    })
 
})

describe("endElection",function(){

       it(" admin can end election and new phase is now ended", async function(){

 await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     expect(await ElectionManagerContract.electionCount()).to.equal(ElectionId);

await ElectionManagerContract.connect(addr1).startElection(ElectionId) ;

await ElectionManagerContract.connect(addr1).endElection(ElectionId);
const [ , , , phase , , ] = await ElectionManagerContract.getElection(ElectionId);
expect(phase).to.equal(2);

       })
   
    it("ElectionEnded event emitted", async function(){
await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     expect(await ElectionManagerContract.electionCount()).to.equal(ElectionId);

await ElectionManagerContract.connect(addr1).startElection(ElectionId) ;

await expect(ElectionManagerContract.connect(addr1).endElection(ElectionId)).to.emit(ElectionManagerContract ,"ElectionEnded").withArgs(ElectionId);


    })  
     it(" non-admin cannot end election , state will not change ", async function(){
await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     expect(await ElectionManagerContract.electionCount()).to.equal(ElectionId);

await ElectionManagerContract.connect(addr1).startElection(ElectionId) ;

await expect(ElectionManagerContract.connect(addr2).endElection(ElectionId)).to.be.revertedWithCustomError(ElectionManagerContract ,"NotAdmin")

     })
   
    it("cannot end before start", async function(){

await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     expect(await ElectionManagerContract.electionCount()).to.equal(ElectionId);
await expect( ElectionManagerContract.endElection(ElectionId)).to.be.revertedWithCustomError(ElectionManagerContract,"WrongPhase");

    })

    it("cannot end already ended election", async function(){
         await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     expect(await ElectionManagerContract.electionCount()).to.equal(ElectionId);

await ElectionManagerContract.connect(addr1).startElection(ElectionId) ;

await ElectionManagerContract.connect(addr1).endElection(ElectionId);

await expect( ElectionManagerContract.endElection(ElectionId)).to.be.revertedWithCustomError(ElectionManagerContract,"WrongPhase");
    }) 
   
    
})
describe("whitelistVoters",function(){

       it("admin can whitelist voters and phase should be in setup phase and should revert for wrong phase", async function(){
        await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     expect(await ElectionManagerContract.electionCount()).to.equal(ElectionId);

const [ , , , phase , , ] = await ElectionManagerContract.getElection(ElectionId);
expect(phase).to.equal(0);

const votersList = [
        addr1.address,
        addr2.address,
        admin1.address
    ];

    await ElectionManagerContract.whitelistVoters(
        ElectionId,
        votersList
    );

for( const voter of votersList){

    expect(await ElectionManagerContract.isWhitelisted(ElectionId,
            voter)).to.equal(true);
}

await ElectionManagerContract.startElection(ElectionId);
await expect(ElectionManagerContract.whitelistVoters(ElectionId,votersList)).to.be.revertedWithCustomError(ElectionManagerContract ,"WrongPhase")
       })
       
   
    it("VotersWhitelisted event emitted", async function(){

await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     expect(await ElectionManagerContract.electionCount()).to.equal(ElectionId);

const votersList = [addr1.address,addr2.address,admin1.address];

    await ElectionManagerContract.whitelistVoters(ElectionId,votersList);

await expect(ElectionManagerContract.whitelistVoters(ElectionId,votersList)).to.emit(ElectionManagerContract ,"VotersWhitelisted").withArgs(ElectionId , votersList.length)
    })

       it(" non-admin cannot whitelist", async function(){
await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
  
const votersList = [addr1.address,addr2.address,admin1.address];

    await expect(ElectionManagerContract.connect(addr2).whitelistVoters(ElectionId,votersList)).to.be.revertedWithCustomError(ElectionManagerContract,"NotAdmin");
       })

    it(" cannot whitelist during Active or Ended", async function(){
      
await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     expect(await ElectionManagerContract.electionCount()).to.equal(ElectionId);

await ElectionManagerContract.connect(addr1).startElection(ElectionId) ;

const votersList = [
        addr1.address,
        addr2.address,
        admin1.address
    ];
   await expect(ElectionManagerContract.whitelistVoters(ElectionId,votersList)).to.revertedWithCustomError(ElectionManagerContract,"WrongPhase") 
    })

    
})

describe("removeVoterFromWhitelist",function(){

      it("admin can remove voter", async function(){
await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     

const votersList = [
        addr1.address,
        addr2.address,
        admin1.address
    ];

    await ElectionManagerContract.whitelistVoters(
        ElectionId,
        votersList
    );

   for (const voter of votersList) {
    await ElectionManagerContract.removeVoterFromWhitelist(
        ElectionId,
        voter
    );
}

for( const voter of votersList){
    expect(await ElectionManagerContract.isWhitelisted(ElectionId,
            voter)).to.equal(false);
    }
})

    it(" removal of voter from whitelist event emitted", async function(){

await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     

const votersList = [
        addr1.address,
        addr2.address,
        admin1.address
    ];

    await ElectionManagerContract.whitelistVoters(
        ElectionId,
        votersList
    );

   for (const voter of votersList) {
    await expect(ElectionManagerContract.removeVoterFromWhitelist(ElectionId,voter)).to.emit(ElectionManagerContract,"VoterRemovedFromWhitelist").withArgs(ElectionId,voter)
    ;
}

    })

       it(" non-admin should revert", async function(){
await ElectionManagerContract.addAdmin(addr1.address);
expect(await ElectionManagerContract.admins(addr1.address)).to.be.equal(true);
const initialElectionCount = await ElectionManagerContract.electionCount();
const ElectionId = initialElectionCount + 1n;
const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
const startTime = currentTime + 60;     // 1 min later
const endTime = currentTime + 3600;     // 1 hour later

await ElectionManagerContract.connect(addr1).createElection("studentLeader",  startTime , endTime );
     

const votersList = [
        addr1.address,
        addr2.address,
        admin1.address
    ];

    await ElectionManagerContract.whitelistVoters(
        ElectionId,
        votersList
    );

   for (const voter of votersList) {
    await expect(ElectionManagerContract.connect(addr2).removeVoterFromWhitelist(
        ElectionId,
        voter)
    ).to.be.revertedWithCustomError(ElectionManagerContract,"NotAdmin");
   }
       })
    })
   


describe("incrementCandidateCount",function(){

    beforeEach(async function () {
    Voting = await ethers.getContractFactory("Voting");

    votingContract = await Voting.deploy(
        ElectionManagerContract.target
    );

    await ElectionManagerContract.setVotingContract(
        votingContract.target
    );
});
    it("only voting contract can call", async function(){
        await expect(ElectionManagerContract.incrementCandidateCount(1)).to.be.revertedWithCustomError(ElectionManagerContract,"NotVotingContract");

    })
   
       it(" invalid electionId revert", async function(){
         await expect(votingContract.registerCandidate(432,"Jindal" ,"uri" ,200,false)).to.be.reverted;
       })

        it("count increments correctly", async function(){
            const currentTime =
        (await ethers.provider.getBlock("latest"))
            .timestamp;

    await ElectionManagerContract.createElection(
        "Election",
        currentTime + 60,
        currentTime + 3600
    );

    await ElectionManagerContract.setVotingContract(
        votingContract.target
    );

    await votingContract.registerCandidate(1,"Rahul","uri",800, false );

    const election =
        await ElectionManagerContract.getElection(1);

    expect(election[4]).to.equal(1);
        })
  
})

describe("SetVotingContract",function(){

   it(" owner can set", async function(){
     expect(await ElectionManagerContract.votingContract()).to.equal(ethers.ZeroAddress);
await ElectionManagerContract.setVotingContract(addr1.address);
 expect(await ElectionManagerContract.votingContract()).to.equal(addr1.address);
   }) 

   it(" event emitted", async function(){
    await ElectionManagerContract.setVotingContract(addr1.address);
     expect(await ElectionManagerContract.votingContract()).to.emit(ElectionManagerContract,"VotingContractSet").withArgs(addr1.address)
   }) 
   it("non-owner revert", async function(){
 await expect(ElectionManagerContract.connect(addr1).setVotingContract(addr2.address)).to.be.revertedWithCustomError(ElectionManagerContract,"NotOwner");

        expect(await ElectionManagerContract.votingContract()).to.equal(ethers.ZeroAddress);

   }) 
})
// it("", async function(){})
} )