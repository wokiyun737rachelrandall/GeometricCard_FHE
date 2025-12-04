// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract GeometricCardFHE is SepoliaConfig {
    struct EncryptedGeometry {
        uint256 id;
        euint32 encryptedShape2D;
        euint32 encryptedShape3D;
        uint256 timestamp;
    }

    struct DecryptedGeometry {
        string shape2D;
        string shape3D;
        bool isDecrypted;
    }

    uint256 public geometryCount;
    mapping(uint256 => EncryptedGeometry) public encryptedGeometries;
    mapping(uint256 => DecryptedGeometry) public decryptedGeometries;

    mapping(string => euint32) private encryptedIntersectionCount;
    string[] private intersectionCategories;

    mapping(uint256 => uint256) private requestToGeometryId;

    event GeometrySubmitted(uint256 indexed id, uint256 timestamp);
    event DecryptionRequested(uint256 indexed id);
    event GeometryDecrypted(uint256 indexed id);

    modifier onlyParticipant(uint256 geometryId) {
        _;
    }

    function submitEncryptedGeometry(
        euint32 encryptedShape2D,
        euint32 encryptedShape3D
    ) public {
        geometryCount += 1;
        uint256 newId = geometryCount;

        encryptedGeometries[newId] = EncryptedGeometry({
            id: newId,
            encryptedShape2D: encryptedShape2D,
            encryptedShape3D: encryptedShape3D,
            timestamp: block.timestamp
        });

        decryptedGeometries[newId] = DecryptedGeometry({
            shape2D: "",
            shape3D: "",
            isDecrypted: false
        });

        emit GeometrySubmitted(newId, block.timestamp);
    }

    function requestGeometryDecryption(uint256 geometryId) public onlyParticipant(geometryId) {
        EncryptedGeometry storage geo = encryptedGeometries[geometryId];
        require(!decryptedGeometries[geometryId].isDecrypted, "Already decrypted");

        bytes32[] memory ciphertexts = new bytes32[](2);
        ciphertexts[0] = FHE.toBytes32(geo.encryptedShape2D);
        ciphertexts[1] = FHE.toBytes32(geo.encryptedShape3D);

        uint256 reqId = FHE.requestDecryption(ciphertexts, this.decryptGeometry.selector);
        requestToGeometryId[reqId] = geometryId;

        emit DecryptionRequested(geometryId);
    }

    function decryptGeometry(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory proof
    ) public {
        uint256 geometryId = requestToGeometryId[requestId];
        require(geometryId != 0, "Invalid request");

        EncryptedGeometry storage eGeo = encryptedGeometries[geometryId];
        DecryptedGeometry storage dGeo = decryptedGeometries[geometryId];
        require(!dGeo.isDecrypted, "Already decrypted");

        FHE.checkSignatures(requestId, cleartexts, proof);

        string[] memory results = abi.decode(cleartexts, (string[]));
        dGeo.shape2D = results[0];
        dGeo.shape3D = results[1];
        dGeo.isDecrypted = true;

        if (!FHE.isInitialized(encryptedIntersectionCount[results[1]])) {
            encryptedIntersectionCount[results[1]] = FHE.asEuint32(0);
            intersectionCategories.push(results[1]);
        }
        encryptedIntersectionCount[results[1]] = FHE.add(
            encryptedIntersectionCount[results[1]],
            FHE.asEuint32(1)
        );

        emit GeometryDecrypted(geometryId);
    }

    function getDecryptedGeometry(uint256 geometryId) public view returns (
        string memory shape2D,
        string memory shape3D,
        bool isDecrypted
    ) {
        DecryptedGeometry storage geo = decryptedGeometries[geometryId];
        return (geo.shape2D, geo.shape3D, geo.isDecrypted);
    }

    function getEncryptedIntersectionCount(string memory category) public view returns (euint32) {
        return encryptedIntersectionCount[category];
    }

    function requestIntersectionCountDecryption(string memory category) public {
        euint32 count = encryptedIntersectionCount[category];
        require(FHE.isInitialized(count), "Category not found");

        bytes32[] memory ciphertexts = new bytes32[](1);
        ciphertexts[0] = FHE.toBytes32(count);

        uint256 reqId = FHE.requestDecryption(ciphertexts, this.decryptIntersectionCount.selector);
        requestToGeometryId[reqId] = bytes32ToUint(keccak256(abi.encodePacked(category)));
    }

    function decryptIntersectionCount(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory proof
    ) public {
        uint256 categoryHash = requestToGeometryId[requestId];
        string memory category = getCategoryFromHash(categoryHash);

        FHE.checkSignatures(requestId, cleartexts, proof);

        uint32 count = abi.decode(cleartexts, (uint32));
    }

    function bytes32ToUint(bytes32 b) private pure returns (uint256) {
        return uint256(b);
    }

    function getCategoryFromHash(uint256 hash) private view returns (string memory) {
        for (uint i = 0; i < intersectionCategories.length; i++) {
            if (bytes32ToUint(keccak256(abi.encodePacked(intersectionCategories[i]))) == hash) {
                return intersectionCategories[i];
            }
        }
        revert("Category not found");
    }
}