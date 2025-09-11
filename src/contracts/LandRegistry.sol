// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title LandRegistry
 * @dev A comprehensive land registry system with government oversight and secure trading
 * @author Ardhi Registries Team
 */
contract LandRegistry is Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // Structs
    struct User {
        address userAddress;
        string name;
        string contact;
        string email;
        string postalCode;
        string city;
        bool exists;
        uint256 registrationTime;
        bool isActive;
    }

    struct LandDetails {
        address payable owner;
        string ipfsHash;
        string landAddress;
        uint256 price;
        uint256 landId;
        ApprovalStatus governmentApproval;
        AvailabilityStatus availability;
        address requester;
        RequestStatus requestStatus;
        uint256 registrationTime;
        uint256 lastUpdated;
        bool exists;
        string description;
        uint256 area; // in square meters
    }

    struct Profiles {
        uint256[] assetList;
        uint256 totalLands;
    }

    // Enums for better type safety
    enum ApprovalStatus {
        Pending,
        Approved,
        Rejected
    }

    enum AvailabilityStatus {
        NotAvailable,
        Available,
        Requested,
        ApprovedForPurchase
    }

    enum RequestStatus {
        Default,
        Pending,
        Rejected,
        Approved
    }

    // State variables
    Counters.Counter private _landCounter;
    Counters.Counter private _userCounter;
    
    // Arrays for iteration
    address[] public userAddresses;
    uint256[] public landAssets;
    
    // Mappings
    mapping(address => User) public users;
    mapping(uint256 => LandDetails) public lands;
    mapping(address => Profiles) public userProfiles;
    mapping(address => bool) public governmentOfficials;
    mapping(address => bool) public registeredUsers;
    mapping(string => bool) public usedEmails;
    mapping(string => bool) public usedLandAddresses;

    // Events
    event UserRegistered(address indexed userAddress, string name, string email);
    event UserDeactivated(address indexed userAddress);
    event LandRegistered(uint256 indexed landId, address indexed owner, string landAddress, uint256 price);
    event LandRequested(uint256 indexed landId, address indexed requester);
    event LandApproved(uint256 indexed landId, address indexed owner, ApprovalStatus status);
    event LandRejected(uint256 indexed landId, address indexed owner);
    event LandSold(uint256 indexed landId, address indexed from, address indexed to, uint256 price);
    event LandUpdated(uint256 indexed landId, address indexed owner);
    event GovernmentOfficialAdded(address indexed official);
    event GovernmentOfficialRemoved(address indexed official);
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);

    // Modifiers
    modifier onlyRegisteredUser() {
        require(users[msg.sender].exists && users[msg.sender].isActive, "User not registered or inactive");
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

    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    modifier validString(string memory _str) {
        require(bytes(_str).length > 0, "String cannot be empty");
        _;
    }

    modifier validPrice(uint256 _price) {
        require(_price > 0, "Price must be greater than 0");
        _;
    }

    constructor() {
        // Initialize counters
        _landCounter.increment(); // Start from 1
        _userCounter.increment(); // Start from 1
    }

    // Government functions
    function addGovernmentOfficial(address _official) 
        external 
        onlyOwner 
        validAddress(_official) 
    {
        require(!governmentOfficials[_official], "Official already added");
        governmentOfficials[_official] = true;
        emit GovernmentOfficialAdded(_official);
    }

    function removeGovernmentOfficial(address _official) 
        external 
        onlyOwner 
        validAddress(_official) 
    {
        require(governmentOfficials[_official], "Official not found");
        governmentOfficials[_official] = false;
        emit GovernmentOfficialRemoved(_official);
    }

    function isGovernmentOfficial(address _official) external view returns (bool) {
        return governmentOfficials[_official];
    }

    // User registration
    function registerUser(
        string memory _name,
        string memory _contact,
        string memory _email,
        string memory _postalCode,
        string memory _city
    ) external whenNotPaused validString(_name) validString(_email) {
        require(!users[msg.sender].exists, "User already registered");
        require(!usedEmails[_email], "Email already registered");
        require(bytes(_contact).length > 0, "Contact cannot be empty");
        require(bytes(_postalCode).length > 0, "Postal code cannot be empty");
        require(bytes(_city).length > 0, "City cannot be empty");
        
        users[msg.sender] = User({
            userAddress: msg.sender,
            name: _name,
            contact: _contact,
            email: _email,
            postalCode: _postalCode,
            city: _city,
            exists: true,
            registrationTime: block.timestamp,
            isActive: true
        });
        
        registeredUsers[msg.sender] = true;
        usedEmails[_email] = true;
        userAddresses.push(msg.sender);
        
        emit UserRegistered(msg.sender, _name, _email);
    }

    function deactivateUser(address _userAddress) 
        external 
        onlyGovernmentOfficial 
        validAddress(_userAddress) 
    {
        require(users[_userAddress].exists, "User does not exist");
        users[_userAddress].isActive = false;
        emit UserDeactivated(_userAddress);
    }

    function reactivateUser(address _userAddress) 
        external 
        onlyGovernmentOfficial 
        validAddress(_userAddress) 
    {
        require(users[_userAddress].exists, "User does not exist");
        users[_userAddress].isActive = true;
    }

    function getUser(address _userAddress) external view returns (User memory) {
        require(users[_userAddress].exists, "User does not exist");
        return users[_userAddress];
    }

    // Land registration
    function registerLand(
        string memory _ipfsHash,
        string memory _landAddress,
        uint256 _price,
        string memory _description,
        uint256 _area
    ) external onlyRegisteredUser whenNotPaused validString(_ipfsHash) validString(_landAddress) validPrice(_price) returns (uint256) {
        require(!usedLandAddresses[_landAddress], "Land address already registered");
        require(_area > 0, "Area must be greater than 0");
        require(bytes(_description).length > 0, "Description cannot be empty");
        
        uint256 landId = _landCounter.current();
        _landCounter.increment();
        
        lands[landId] = LandDetails({
            owner: payable(msg.sender),
            ipfsHash: _ipfsHash,
            landAddress: _landAddress,
            price: _price,
            landId: landId,
            governmentApproval: ApprovalStatus.Pending,
            availability: AvailabilityStatus.NotAvailable,
            requester: address(0),
            requestStatus: RequestStatus.Default,
            registrationTime: block.timestamp,
            lastUpdated: block.timestamp,
            exists: true,
            description: _description,
            area: _area
        });
        
        userProfiles[msg.sender].assetList.push(landId);
        userProfiles[msg.sender].totalLands++;
        landAssets.push(landId);
        usedLandAddresses[_landAddress] = true;
        
        emit LandRegistered(landId, msg.sender, _landAddress, _price);
        return landId;
    }

    function updateLandDetails(
        uint256 _landId,
        uint256 _newPrice,
        string memory _newDescription
    ) external onlyRegisteredUser landExists(_landId) whenNotPaused {
        require(lands[_landId].owner == msg.sender, "Only land owner can update");
        require(_newPrice > 0, "Price must be greater than 0");
        require(bytes(_newDescription).length > 0, "Description cannot be empty");
        
        lands[_landId].price = _newPrice;
        lands[_landId].description = _newDescription;
        lands[_landId].lastUpdated = block.timestamp;
        
        emit LandUpdated(_landId, msg.sender);
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
    function approveLand(uint256 _landId, ApprovalStatus _approvalStatus) 
        external 
        onlyGovernmentOfficial 
        landExists(_landId) 
        whenNotPaused 
    {
        lands[_landId].governmentApproval = _approvalStatus;
        lands[_landId].lastUpdated = block.timestamp;
        
        if (_approvalStatus == ApprovalStatus.Approved) {
            lands[_landId].availability = AvailabilityStatus.Available;
            emit LandApproved(_landId, lands[_landId].owner, _approvalStatus);
        } else if (_approvalStatus == ApprovalStatus.Rejected) {
            lands[_landId].availability = AvailabilityStatus.NotAvailable;
            emit LandRejected(_landId, lands[_landId].owner);
        }
    }

    function batchApproveLands(uint256[] memory _landIds, ApprovalStatus _approvalStatus) 
        external 
        onlyGovernmentOfficial 
        whenNotPaused 
    {
        require(_landIds.length > 0, "No lands provided");
        require(_landIds.length <= 50, "Too many lands in batch");
        
        for (uint256 i = 0; i < _landIds.length; i++) {
            uint256 landId = _landIds[i];
            if (lands[landId].exists) {
                lands[landId].governmentApproval = _approvalStatus;
                lands[landId].lastUpdated = block.timestamp;
                
                if (_approvalStatus == ApprovalStatus.Approved) {
                    lands[landId].availability = AvailabilityStatus.Available;
                    emit LandApproved(landId, lands[landId].owner, _approvalStatus);
                } else if (_approvalStatus == ApprovalStatus.Rejected) {
                    lands[landId].availability = AvailabilityStatus.NotAvailable;
                    emit LandRejected(landId, lands[landId].owner);
                }
            }
        }
    }

    // Land request and purchase functions
    function requestLand(uint256 _landId) external onlyRegisteredUser landExists(_landId) whenNotPaused {
        require(lands[_landId].owner != msg.sender, "Cannot request your own land");
        require(lands[_landId].governmentApproval == ApprovalStatus.Approved, "Land not approved by government");
        require(lands[_landId].availability == AvailabilityStatus.Available, "Land not available");
        require(lands[_landId].requester == address(0), "Land already has a pending request");
        
        lands[_landId].requester = msg.sender;
        lands[_landId].availability = AvailabilityStatus.Requested;
        lands[_landId].requestStatus = RequestStatus.Pending;
        lands[_landId].lastUpdated = block.timestamp;
        
        emit LandRequested(_landId, msg.sender);
    }

    function processLandRequest(uint256 _landId, RequestStatus _status) 
        external 
        landExists(_landId) 
        whenNotPaused 
    {
        require(lands[_landId].owner == msg.sender, "Only land owner can process requests");
        require(lands[_landId].requestStatus == RequestStatus.Pending, "No pending request");
        require(_status == RequestStatus.Approved || _status == RequestStatus.Rejected, "Invalid status");
        
        lands[_landId].requestStatus = _status;
        lands[_landId].lastUpdated = block.timestamp;
        
        if (_status == RequestStatus.Approved) {
            lands[_landId].availability = AvailabilityStatus.ApprovedForPurchase;
        } else {
            lands[_landId].availability = AvailabilityStatus.Available;
            lands[_landId].requester = address(0);
        }
    }

    function cancelLandRequest(uint256 _landId) external landExists(_landId) whenNotPaused {
        require(lands[_landId].requester == msg.sender, "Only requester can cancel");
        require(lands[_landId].requestStatus == RequestStatus.Pending, "No pending request to cancel");
        
        lands[_landId].requester = address(0);
        lands[_landId].availability = AvailabilityStatus.Available;
        lands[_landId].requestStatus = RequestStatus.Default;
        lands[_landId].lastUpdated = block.timestamp;
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
        require(lands[_landId].availability == AvailabilityStatus.ApprovedForPurchase, "Land not available for purchase");
        
        address previousOwner = lands[_landId].owner;
        uint256 price = lands[_landId].price;
        
        // Transfer ownership
        _removeOwnership(previousOwner, _landId);
        lands[_landId].owner = payable(msg.sender);
        lands[_landId].requester = address(0);
        lands[_landId].requestStatus = RequestStatus.Default;
        lands[_landId].governmentApproval = ApprovalStatus.Pending;
        lands[_landId].availability = AvailabilityStatus.NotAvailable;
        lands[_landId].lastUpdated = block.timestamp;
        userProfiles[msg.sender].assetList.push(_landId);
        userProfiles[msg.sender].totalLands++;
        
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
                userProfiles[_previousOwner].totalLands--;
                break;
            }
        }
    }

    // Utility functions
    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }

    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    function getLandCount() external view returns (uint256) {
        return _landCounter.current() - 1; // Subtract 1 because we start from 1
    }

    function getUserCount() external view returns (uint256) {
        return userAddresses.length;
    }

    function getLandsByOwner(address _owner) external view returns (uint256[] memory) {
        return userProfiles[_owner].assetList;
    }

    function getAvailableLands() external view returns (uint256[] memory) {
        uint256[] memory availableLands = new uint256[](landAssets.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < landAssets.length; i++) {
            uint256 landId = landAssets[i];
            if (lands[landId].availability == AvailabilityStatus.Available && 
                lands[landId].governmentApproval == ApprovalStatus.Approved) {
                availableLands[count] = landId;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = availableLands[i];
        }
        
        return result;
    }

    function getPendingApprovalLands() external view returns (uint256[] memory) {
        uint256[] memory pendingLands = new uint256[](landAssets.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < landAssets.length; i++) {
            uint256 landId = landAssets[i];
            if (lands[landId].governmentApproval == ApprovalStatus.Pending) {
                pendingLands[count] = landId;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pendingLands[i];
        }
        
        return result;
    }

    function isUserRegistered(address _user) external view returns (bool) {
        return users[_user].exists && users[_user].isActive;
    }

    function getLandStatus(uint256 _landId) external view landExists(_landId) returns (
        ApprovalStatus governmentApproval,
        AvailabilityStatus availability,
        RequestStatus requestStatus
    ) {
        return (
            lands[_landId].governmentApproval,
            lands[_landId].availability,
            lands[_landId].requestStatus
        );
    }

    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
