// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev ReentrancyGuard เพื่อป้องกันการโจมตีประเภท Reentrancy
 */
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

/**
 * @title ZyrquenSovereignCore
 * @notice แก้ไขช่องโหว่ ZYR-01 และ ZYR-03
 */
contract ZyrquenSovereignCore {
    address public sovereignOwner;
    address public sentinelOracle;
    bool public quarantineSeal;

    event SovereignUpdated(address indexed newOwner);
    event QuarantineSealUpdated(bool status);

    constructor(address _sentinelOracle) {
        sovereignOwner = msg.sender;
        sentinelOracle = _sentinelOracle;
        quarantineSeal = false;
    }

    // [ZYR-01 FIX] เปลี่ยนจากการเปรียบเทียบ keccak256 เป็นการตรวจสอบ address โดยตรง
    modifier onlySovereign() {
        require(msg.sender == sovereignOwner, "ZYR-01: Caller is not sovereign owner");
        _;
    }

    // [ZYR-03 FIX] จำกัดสิทธิ์เฉพาะ Sentinel AI Oracle สำหรับ Quarantine State
    modifier onlySentinelOracle() {
        require(msg.sender == sentinelOracle, "ZYR-03: Caller is not Sentinel AI Oracle");
        _;
    }

    function setSovereignOwner(address _newOwner) external onlySovereign {
        require(_newOwner != address(0), "ZYR: Invalid address");
        sovereignOwner = _newOwner;
        emit SovereignUpdated(_newOwner);
    }

    function updateQuarantineSeal(bool _status) external onlySentinelOracle {
        quarantineSeal = _status;
        emit QuarantineSealUpdated(_status);
    }
}

/**
 * @title ZyrquenFiosTreasuryDistributor
 * @notice แก้ไขช่องโหว่ ZYR-02 และ ZYR-05
 */
contract ZyrquenFiosTreasuryDistributor is ReentrancyGuard {
    address public sovereignCore;
    uint8 public constant REQUIRED_QUORUM = 10;
    bool public isFailClosedActive;

    event FailClosedTriggered(address indexed triggeredBy, uint256 timestamp);
    event FundsDistributed(address indexed recipient, uint256 amount);

    constructor(address _sovereignCore) {
        sovereignCore = _sovereignCore;
    }

    modifier onlySovereignCore() {
        require(msg.sender == sovereignCore, "ZYR: Not sovereign core contract");
        _;
    }

    // [ZYR-02 FIX] ป้องกัน DoS โดยเพิ่มสิทธิ์เฉพาะ Core และบังคับเช็ก 10/10 Quorum
    function triggerFailClosed(uint8 _quorumSignatures) external onlySovereignCore {
        require(_quorumSignatures >= REQUIRED_QUORUM, "ZYR-02: 10/10 Deca-Key Quorum required");
        isFailClosedActive = true;
        emit FailClosedTriggered(msg.sender, block.timestamp);
    }

    // [ZYR-05 FIX] เปลี่ยนจาก .transfer() (2300 gas) เป็น low-level .call ร่วมกับ nonReentrant
    function distributeTreasury(address payable _recipient, uint256 _amount) external onlySovereignCore nonReentrant {
        require(!isFailClosedActive, "ZYR: System is Fail-Closed");
        require(address(this).balance >= _amount, "ZYR: Insufficient treasury balance");

        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "ZYR-05: Transfer failed");

        emit FundsDistributed(_recipient, _amount);
    }

    receive() external payable {}
}
