export const conditionalTokensABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "collateralToken", "type": "address" },
            { "internalType": "bytes32", "name": "parentCollectionId", "type": "bytes32" },
            { "internalType": "bytes32", "name": "conditionId", "type": "bytes32" },
            { "internalType": "uint256[]", "name": "indexSets", "type": "uint256[]" }
        ],
        "name": "redeemPositions",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "owner", "type": "address" },
            { "internalType": "address", "name": "operator", "type": "address" }
        ],
        "name": "isApprovedForAll",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "operator", "type": "address" },
            { "internalType": "bool", "name": "approved", "type": "bool" }
        ],
        "name": "setApprovalForAll",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "conditionId", "type": "bytes32" }
        ],
        "name": "payoutDenominator",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "owner", "type": "address" },
            { "internalType": "uint256", "name": "id", "type": "uint256" }
        ],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "parentCollectionId", "type": "bytes32" },
            { "internalType": "bytes32", "name": "conditionId", "type": "bytes32" },
            { "internalType": "uint256", "name": "indexSet", "type": "uint256" }
        ],
        "name": "getCollectionId",
        "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "collateralToken", "type": "address" },
            { "internalType": "bytes32", "name": "collectionId", "type": "bytes32" }
        ],
        "name": "getPositionId",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "pure",
        "type": "function"
    }
];
