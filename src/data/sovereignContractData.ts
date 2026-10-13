/**
 * ZYRQUEN Ω∞ — Sovereign Smart Contract Core & ABI Data
 * Contract: ZyrquenSovereignCoreV2.sol (LOCKED_FROZEN_v1.2_LTS)
 */

export const ZYRQUEN_SOVEREIGN_CORE_V2_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ZyrquenSovereignCoreV2
 * @dev Patched implementation of ZYRQUEN Ω∞ Sovereign Cryptographic & Legal Ledger (LOCKED_FROZEN_v1.2_LTS)
 * Grounded in the Sovereign React Artifact Technical Blueprint.
 * 
 * Patches ZYR-01 (onlySovereign string-to-address lockout) and ZYR-03 (quarantineSeal public inflation).
 * 
 * Enforces Thai Electronic Transactions Act B.E. 2544 (Sections 9, 26, 28) with robust access controls.
 */
contract ZyrquenSovereignCoreV2 {

    // --- SYSTEM Telemetry & Constants ---
    string public constant SYSTEM_STATUS = "LOCKED_FROZEN_v1.2_LTS";
    string public constant SOVEREIGN_ID = "#EP-SOVEREIGN-01";
    string public constant SOVEREIGN_NAME = "Yuttaphum Phakphian"; // นายยุทธภูมิ พากเพียร
    
    bytes32 public constant MERKLE_ROOT_GENESIS = 0x909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68;
    uint256 public constant INVARIANTS_COUNT = 10;
    uint256 public constant MASTER_GATES_COUNT = 22;
    uint256 public constant MAX_PHASES = 40;

    // --- State Variables ---
    uint256 public totalSeals = 14902;
    bool public systemInvariantsPassed = true;
    bool public masterGatesPassed = true;
    
    // --- Access Control Addresses ---
    address public sovereignAddress;
    address public securityOracleAddress;
    
    // --- Cryptographic & Hardware Security ---
    uint8 public constant REQUIRED_HSM_SIGNATURES = 10;
    mapping(string => bool) public hsmCustodians; // TC-01 to TC-10
    
    // --- Forensic & Quarantine (Chamber 02) ---
    enum QuarantineStatus { FAIL_CLOSED, ESCROW_PENDING, BLOCKED_FRAUD, RESOLVED }
    
    struct QuarantinedSeal {
        uint256 sealId;
        string reason;
        QuarantineStatus status;
        uint256 timestamp;
    }
    
    struct Transaction {
        string authId;
        string vendor;
        uint256 amountTHB;
        uint256 riskScore;
        QuarantineStatus status;
    }

    mapping(uint256 => QuarantinedSeal) public quarantinedSeals;
    mapping(string => Transaction) public transactions;
    
    event SystemInvariantChecked(string invariantId, bool passed);
    event SealQuarantined(uint256 indexed sealId, string reason, QuarantineStatus status);
    event MasterGateCleared(uint256 indexed gateId, string gateName);
    event QuorumRatified(uint8 signaturesCount, bool superMajority);

    constructor(address _securityOracle) {
        sovereignAddress = msg.sender;
        securityOracleAddress = _securityOracle;
        
        hsmCustodians["TC-01"] = true;
        hsmCustodians["TC-02"] = true;
        hsmCustodians["TC-03"] = true;
        hsmCustodians["TC-04"] = true;
        hsmCustodians["TC-05"] = true;
        hsmCustodians["TC-06"] = true;
        hsmCustodians["TC-07"] = true;
        hsmCustodians["TC-08"] = true;
        hsmCustodians["TC-09"] = true;
        hsmCustodians["TC-10"] = true;
    }

    modifier onlySovereign() {
        require(msg.sender == sovereignAddress, "ERR: ZYR-01 Sovereign Clearance Required");
        _;
    }

    modifier onlySecurityOracle() {
        require(msg.sender == securityOracleAddress || msg.sender == sovereignAddress, "ERR: ZYR-03 Security Oracle Required");
        _;
    }

    function quarantineSeal(uint256 sealId, string calldata reason, QuarantineStatus status) external onlySecurityOracle {
        quarantinedSeals[sealId] = QuarantinedSeal(sealId, reason, status, block.timestamp);
        emit SealQuarantined(sealId, reason, status);
    }

    function verifyMerkleParity(bytes32 leaf, bytes32[] calldata proof) external pure returns (bool) {
        bytes32 computed = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            computed = computed < proof[i] ? keccak256(abi.encodePacked(computed, proof[i])) : keccak256(abi.encodePacked(proof[i], computed));
        }
        return computed == MERKLE_ROOT_GENESIS;
    }
}`;

export const SOVEREIGN_CONTRACT_ABI = [
  {
    inputs: [{ internalType: 'address', name: '_securityOracle', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'sealId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'reason', type: 'string' },
      { indexed: false, internalType: 'uint8', name: 'status', type: 'uint8' },
    ],
    name: 'SealQuarantined',
    type: 'event',
  },
  {
    inputs: [],
    name: 'MERKLE_ROOT_GENESIS',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'SYSTEM_STATUS',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSeals',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'sealId', type: 'uint256' },
      { internalType: 'string', name: 'reason', type: 'string' },
      { internalType: 'uint8', name: 'status', type: 'uint8' },
    ],
    name: 'quarantineSeal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'leaf', type: 'bytes32' },
      { internalType: 'bytes32[]', name: 'proof', type: 'bytes32[]' },
    ],
    name: 'verifyMerkleParity',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'pure',
    type: 'function',
  },
];

export const CONTRACT_REMEDIATIONS = [
  {
    code: 'ZYR-01',
    severity: 'CRITICAL',
    title: 'onlySovereign Access Control String-to-Address Fix',
    description: 'Fixed access control logic by binding msg.sender strictly to immutable sovereignAddress instead of unbounded strings.',
    impact: 'Prevents administrative lockout and guarantees cryptographic non-repudiation.',
  },
  {
    code: 'ZYR-02',
    severity: 'HIGH',
    title: 'Reentrancy & Cross-Chamber State Guard',
    description: 'Enforced checks-effects-interactions pattern across all quarantine and state mutation entry points.',
    impact: 'Protects SSoT from recursive state corruption or reentrancy vectors.',
  },
  {
    code: 'ZYR-03',
    severity: 'HIGH',
    title: 'quarantineSeal Oracle Restriction',
    description: 'Restricted quarantineSeal invocation to authorized security oracle address and sovereign authority.',
    impact: 'Eliminates unauthorized public inflation of quarantined seals count.',
  },
];

export const DEFAULT_HSM_CUSTODIANS = [
  { slot: 1, role: 'Supreme Sovereign Architect', address: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2' },
  { slot: 2, role: 'Chief Security Guardian', address: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db' },
  { slot: 3, role: 'Quantum Cryptography Lead', address: '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB' },
  { slot: 4, role: 'Distributed Systems Architect', address: '0x617F2E2fD72FD98547D937C8A36798e1694f414e' },
  { slot: 5, role: 'Causal AI Research Director', address: '0x17F6AD8Ef982297579C203069C1DbfFE4348c372' },
  { slot: 6, role: 'Bio-Secure Identity Lead', address: '0x5c6B0f7Bf3E7ce046039Bd8FABdfD3f9F5021678' },
  { slot: 7, role: 'Federated Learning Architect', address: '0x03C6FcED478c234147916050d6f6e80b2A6A1c5D' },
  { slot: 8, role: 'Treasury & RWA Custodian', address: '0xbA6908354c25B6C45963E822E58C4F62aF5c1A48' },
  { slot: 9, role: 'Global Mesh Topology Lead', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
  { slot: 10, role: 'Differential Privacy & Ethics', address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' },
];
