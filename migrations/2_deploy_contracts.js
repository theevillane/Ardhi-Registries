// eslint-disable-next-line no-undef
const LandRegistry = artifacts.require('LandRegistry')

module.exports = async function (deployer, network, accounts) {
  console.log("Deploying LandRegistry contract...");
  console.log("Network:", network);
  console.log("Deployer account:", accounts[0]);
  
  // Deploy the contract
  await deployer.deploy(LandRegistry);
  
  const landRegistry = await LandRegistry.deployed();
  console.log("LandRegistry deployed at:", landRegistry.address);
  
  // Add the deployer as a government official
  try {
    await landRegistry.addGovernmentOfficial(accounts[0], { from: accounts[0] });
    console.log("Deployer added as government official");
  } catch (error) {
    console.error("Error adding government official:", error);
  }
  
  // Log contract details
  console.log("Contract Details:");
  console.log("- Address:", landRegistry.address);
  console.log("- Owner:", accounts[0]);
  console.log("- Network ID:", await web3.eth.net.getId());
  
  return true;
}
