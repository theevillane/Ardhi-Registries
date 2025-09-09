// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract LandRegistry is Ownable, ReentrancyGuard, Pausable {
    struct User {
        address userAddress;
        string name;
        string contact;
        string email;
        string postalCode;
        string city;
        bool exists;
        uint256 registrationTime;
    }

    struct LandDetails {
        address payable owner;
        string ipfsHash;
        string landAddress;
        uint256 price;
        uint256 landId;
        string governmentApproval;
        string availability;
        address requester;
        RequestStatus requestStatus;
        uint256 registrationTime;
        bool exists;
    }

    struct Profiles {
        uint256[] assetList;
    }

    enum RequestStatus {
        Default,
        Pending,
        Rejected,
        Approved
    }

    // State variables
    address[] public userAddresses;
    uint256[] public landAssets;
    uint256 public landCounter;
    
    // Mappings
    mapping(address => User) public users;
    mapping(uint256 => LandDetails) public lands;
    mapping(address => Profiles) public userProfiles;
    mapping(address => bool) public governmentOfficials;

    // Events
    event UserRegistered(address indexed userAddress, string name, string email);
    event LandRegistered(uint256 indexed landId, address indexed owner, string landAddress);
    event LandRequested(uint256 indexed landId, address indexed requester);
    event LandApproved(uint256 indexed landId, address indexed owner);
    event LandRejected(uint256 indexed landId, address indexed owner);
    event LandSold(uint256 indexed landId, address indexed from, address indexed to, uint256 price);

    // Modifiers
    modifier onlyRegisteredUser() {
        require(users[msg.sender].exists, "User not registered");
        _;
    }

    modifier onlyGovernmentOfficial() {
        require(governmentOfficials[msg.sender], "Not authorized government official");
        _;
    }

    modifier landExists(uint256 _landId) {
        require(lands[_landId].exists, "Land does not exist");
        _;
    }

    constructor() {
        landCounter = 0;
    }

    // Government functions
    function addGovernmentOfficial(address _official) external onlyOwner {
        governmentOfficials[_official] = true;
    }

    function removeGovernmentOfficial(address _official) external onlyOwner {
        governmentOfficials[_official] = false;
    }

    // User registration
    function registerUser(
        string memory _name,
        string memory _contact,
        string memory _email,
        string memory _postalCode,
        string memory _city
    ) external whenNotPaused {
        require(!users[msg.sender].exists, "User already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");
        
        users[msg.sender] = User({
            userAddress: msg.sender,
            name: _name,
            contact: _contact,
            email: _email,
            postalCode: _postalCode,
            city: _city,
            exists: true,
            registrationTime: block.timestamp
        });
        
        userAddresses.push(msg.sender);
        emit UserRegistered(msg.sender, _name, _email);
    }

    function getUser(address _userAddress) external view returns (User memory) {
        require(users[_userAddress].exists, "User does not exist");
        return users[_userAddress];
    }

    // Land registration
    function registerLand(
        string memory _ipfsHash,
        string memory _landAddress,
        uint256 _price
    ) external onlyRegisteredUser whenNotPaused returns (uint256) {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_landAddress).length > 0, "Land address cannot be empty");
        require(_price > 0, "Price must be greater than 0");
        
        uint256 landId = landCounter;
        landCounter++;
        
        lands[landId] = LandDetails({
            owner: payable(msg.sender),
            ipfsHash: _ipfsHash,
            landAddress: _landAddress,
            price: _price,
            landId: landId,
            governmentApproval: "Pending",
            availability: "Not Available",
            requester: address(0),
            requestStatus: RequestStatus.Default,
            registrationTime: block.timestamp,
            exists: true
        });
        
        userProfiles[msg.sender].assetList.push(landId);
        landAssets.push(landId);
        
        emit LandRegistered(landId, msg.sender, _landAddress);
        return landId;
    }

    function getLandDetails(uint256 _landId) external view landExists(_landId) returns (LandDetails memory) {
        return lands[_landId];
    }

    function getUserAssets(address _userAddress) external view returns (uint256[] memory) {
        return userProfiles[_userAddress].assetList;
    }

    function getAllLands() external view returns (uint256[] memory) {
        return landAssets;
    }

    // Government approval functions
    function approveLand(uint256 _landId, string memory _approvalStatus) 
        external 
        onlyGovernmentOfficial 
        landExists(_landId) 
        whenNotPaused 
    {
        lands[_landId].governmentApproval = _approvalStatus;
        if (keccak256(bytes(_approvalStatus)) == keccak256(bytes("Approved"))) {
            lands[_landId].availability = "Available";
            emit LandApproved(_landId, lands[_landId].owner);
        } else {
            lands[_landId].availability = "Not Available";
            emit LandRejected(_landId, lands[_landId].owner);
        }
    }

    // Land request and purchase functions
    function requestLand(uint256 _landId) external onlyRegisteredUser landExists(_landId) whenNotPaused {
        require(lands[_landId].owner != msg.sender, "Cannot request your own land");
        require(keccak256(bytes(lands[_landId].governmentApproval)) == keccak256(bytes("Approved")), "Land not approved by government");
        require(keccak256(bytes(lands[_landId].availability)) == keccak256(bytes("Available")), "Land not available");
        
        lands[_landId].requester = msg.sender;
        lands[_landId].availability = "Requested";
        lands[_landId].requestStatus = RequestStatus.Pending;
        
        emit LandRequested(_landId, msg.sender);
    }

    function processLandRequest(uint256 _landId, RequestStatus _status) 
        external 
        landExists(_landId) 
        whenNotPaused 
    {
        require(lands[_landId].owner == msg.sender, "Only land owner can process requests");
        require(lands[_landId].requestStatus == RequestStatus.Pending, "No pending request");
        
        lands[_landId].requestStatus = _status;
        
        if (_status == RequestStatus.Approved) {
            lands[_landId].availability = "Approved for Purchase";
        } else {
            lands[_landId].availability = "Available";
            lands[_landId].requester = address(0);
        }
    }

    function purchaseLand(uint256 _landId) 
        external 
        payable 
        onlyRegisteredUser 
        landExists(_landId) 
        nonReentrant 
        whenNotPaused 
    {
        require(lands[_landId].requestStatus == RequestStatus.Approved, "Request not approved");
        require(lands[_landId].requester == msg.sender, "Not the approved requester");
        require(msg.value == lands[_landId].price, "Incorrect payment amount");
        
        address previousOwner = lands[_landId].owner;
        uint256 price = lands[_landId].price;
        
        // Transfer ownership
        _removeOwnership(previousOwner, _landId);
        lands[_landId].owner = payable(msg.sender);
        lands[_landId].requester = address(0);
        lands[_landId].requestStatus = RequestStatus.Default;
        lands[_landId].governmentApproval = "Pending";
        lands[_landId].availability = "Not Available";
        userProfiles[msg.sender].assetList.push(_landId);
        
        // Transfer payment
        (bool success, ) = previousOwner.call{value: price}("");
        require(success, "Payment transfer failed");
        
        emit LandSold(_landId, previousOwner, msg.sender, price);
    }

    function _removeOwnership(address _previousOwner, uint256 _landId) private {
        uint256[] storage assets = userProfiles[_previousOwner].assetList;
        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i] == _landId) {
                assets[i] = assets[assets.length - 1];
                assets.pop();
                break;
            }
        }
    }

    // Utility functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getLandCount() external view returns (uint256) {
        return landCounter;
    }

    function getUserCount() external view returns (uint256) {
        return userAddresses.length;
    }
}
