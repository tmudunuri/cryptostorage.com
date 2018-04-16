/**
 * MIT License
 * 
 * Copyright (c) 2018 cryptostorage
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Encapsulates a crypto keypair which has a public and private component.
 * 
 * One of plugin, keypairJson, or splitKeypairs is required.
 * 
 * @param config is initialization configuration
 * 				config.plugin is the crypto plugin
 * 				config.keypairJson is exportable json to initialize from
 * 				config.splitKeypairs are split keypairs to combine and initialize from
 * 				config.privateKey is a private key (hex or wif, encrypted or unencrypted) (optional)
 * 				config.publicAddress is a public address to manually set if not unencrypted (optional)
 * 				config.shareNum is the share number (optional)
 */
function CryptoKeypair(config) {
	
	var that = this;
	var state;
	
	this.getPlugin = function() {
		return state.plugin;
	}
	
	this.getPublicAddress = function() {
		return state.publicAddress;
	}
	
	this.getPrivateLabel = function() {
		return state.plugin.getPrivateLabel();
	}
	
	this.getPrivateHex = function() {
		return state.privateHex;
	}
	
	this.getPrivateWif = function() {
		return state.privateWif;
	}
	
	this.encrypt = function(scheme, passphrase, onProgress, onDone) {
		assertNull(decoded.encryption, "Keypair must be unencrypted to encrypt");
		var address = that.getPublicAddress();
		AppUtils.encryptHex(that.getPrivateHex(), scheme, passphrase, onProgress, function(err, encryptedHex) {
			if (err) onDone(err);
			else {
				setPrivateKey(encryptedHex);
				setPublicAddress(address);
				onDone(null, that);
			}
		});
	}
	
	/**
	 * Returns null if unencrypted, undefined if unknown, or one of AppUtils.EncryptionScheme otherwise.
	 */
	this.getEncryptionScheme = function() {
		return state.encryption;
	}
	
	this.isEncrypted = function() {
		assertDefined(that.getEncryptionScheme(), "Keypair encryption is unknown");
		return that.getEncryptionScheme() !== null;
	}
	
	this.decrypt = function(passphrase, onProgress, onDone) {
		assertInitialized(state.encryption, "Keypair must be encrypted to decrypt");
		AppUtils.decryptHex(that.getPrivateHex(), that.getEncryptionScheme(), passphrase, onProgress, function(err, decryptedHex) {
			if (err) onDone(err);
			else {
				setPrivateKey(decryptedHex);
				onDone(null, that);
			}
		});
	}
	
	this.split = function(numShares, minShares) {
		
		// validate input
		assertTrue(numShares >= 2);
		assertTrue(minShares >= 2);
		assertTrue(minShares <= numShares);
		assertTrue(numShares <= AppUtils.MAX_SHARES);
		
		// split private hex into shares
		var shares = secrets.share(that.getPrivateHex(), numShares, minShares);
		
		// encode shares with minimum threshold
		for (var i = 0; i < shares.length; i++) {
			shares[i] = encodeWifShare(shares[i], minShares);
		}
		
		// create keypairs
		var splitKeypairs = [];
		for (var i = 0; i < shares.length; i++) {
			splitKeypairs.push(new CryptoKeypair({
				plugin: state.plugin,
				privateKey: shares[i],
				publicAddress: that.getPublicAddress(),
				shareNum: i + 1
			}));
		}
		return splitKeypairs;
	}
	
	this.isSplit = function() {
		assertDefined(that.getMinShares(), "Keypair split is unknown");
		return that.getMinShares() !== null;
	}
	
	this.getMinShares = function() {
		return state.minShares;
	}
	
	this.getShareNum = function() {
		return state.shareNum;
	}
	
	this.getJson = function() {
		return {
			ticker: state.plugin.getTicker(),
			publicAddress: that.getPublicAddress(),
			privateWif: that.getPrivateWif(),
			encryption: that.getEncryptionScheme(),
			shareNum: that.getShareNum()
		};
	}
	
	this.copy = function() {
		return new CryptoKeypair({
			plugin: state.plugin,
			privateKey: state.privateHex,
			publicAddress: state.publicAddress,
			shareNum: state.shareNum
		});
	}
	
	this.equals = function(keypair) {
		assertObject(keypair, CryptoKeypair);
		return objectsEqual(that.getJson(), keypair.getJson());
	}
	
	this.getState = function() {
		return state;
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	init();
	function init() {
		state = {};
		if (config.plugin) {
			assertTrue(isObject(config.plugin, CryptoPlugin), "Plugin is not a CryptoPlugin");
			state.plugin = config.plugin;
			if (isDefined(config.privateKey)) setPrivateKey(config.privateKey);
			else setPrivateKey(config.plugin.randomPrivateKey());
			if (config.publicAddress) setPublicAddress(config.publicAddress);
		}
		else if (config.keypairJson) fromJson(config.keypairJson);
		else if (config.splitKeypairs) combine(config.splitKeypairs);
		
		// verify state
		verifyState();
	}
	
	// TODO: re-write this to veirfy whole state
	function verifyState() {
		if (!state.plugin && !state.keypairJson && !state.splitKeypairs) {
			throw new Error("One of plugin, keypairJson, or splitKeypairs is required");
		}
		if (state.wif) {
			assertInitialized(state.hex);
			assertDefined(state.minShares);
			if (!state.minShares) assertDefined(state.encryption);
			if (isNumber(state.minShares)) {
				assertUndefined(state.encryption);
				assertTrue(state.minShares >= 2);
				assertTrue(state.minShares <= AppUtils.MAX_SHARES);
				assertTrue(isUndefined(state.shareNum) || state.shareNum === null || isNumber(state.shareNum));
				if (isNumber(state.shareNum)) {
					assertTrue(state.shareNum >= 1);
					assertTrue(state.shareNum <= AppUtils.MAX_SHARES);
				}
			}
		}
		if (state.hex) assertInitialized(state.wif);
	}
	
	function setPrivateKey(privateKey) {
		assertInitialized(state.plugin);
		assertString(privateKey);
		assertInitialized(privateKey);

		// decode with plugin
		var decoded = state.plugin.decode(privateKey);
		if (decoded) {
			state.privateHex = decoded.privateHex;
			state.privateWif = decoded.privateWif;
			state.publicAddress = decoded.publicAddress;
			state.encryption = decoded.encryption;
			state.minShares = null;
			state.shareNum = null;
			return;
		}
		
		// private key must be initialized if encrypted or split
		assertNotNull(privateKey);
		
		// encrypted with cryptostorage conventions
		decoded = decodeEncryptedKey(privateKey);
		if (decoded) {
			state.privateHex = decoded.privateHex;
			state.privateWif = decoded.privateWif;
			state.publicAddress = undefined;
			state.encryption = decoded.encryption;
			state.minShares = null;
			state.shareNum = null;
			return;
		}
		
		// split share with cryptostorage conventions
		decoded = decodeWifShare(privateKey);
		if (decoded) {
			state.privateWif = privateKey;
			state.privateHex = AppUtils.toBase(58, 16, state.privateWif);
			state.publicAddress = undefined;
			state.encryption = undefined;
			state.minShares = decoded.minShares;
			
			// assign share num
			assertTrue(isUndefined(config.shareNum) || config.shareNum === null || isNumber(config.shareNum));
			if (isNumber(config.shareNum)) assertTrue(config.shareNum >= 1 && config.shareNum <= AppUtils.MAX_SHARES);
			state.shareNum = config.shareNum;
			return;
		}
		
		// unrecognized private key
		throw new Error("Unrecognized " + state.plugin.getTicker() + " private key");
	}
	
	// TODO: support old and new format
	function fromJson(keypairJson) {
		plugin = AppUtils.getCryptoPlugin(keypairJson.ticker);
		assertInitialized(state.plugin);
		if (keypairJson.wif) {
			state = plugin.decode(keypairJson.wif);
			assertInitialized(state, "Cannot decode " + plugin.getTicker() + " private string: " + privateKey);
			if (!state.publicAddress) state.publicAddress = keypairJson.address;
			else if (keypairJson.address) assertEquals(state.address, keypairJson.address, "Derived and given addresses do not match");
			if (!state.encryption) state.encryption = keypairJson.encryption;
			else if (keypairJson.encryption) assertEquals(state.encryption, keypairJson.encryption, "Decoded and given encryption schemes do not match");			
		} else {
			state = {};
			state.address = keypairJson.address;
		}
	}
	
	function combine(splitKeypairs) {
		
		// verify keypairs and assign plugin
		var publicAddress;
		for (var i = 0; i < splitKeypairs.length; i++) {
			if (!state.plugin) state.plugin = splitKeypairs[i].getPlugin();
			else if (state.plugin !== splitKeypairs[i].getPlugin()) throw new Error("splitKeypairs[" + i + "] has inconsistent plugin");
			if (!publicAddress) publicAddress = splitKeypairs[i].getPublicAddress();
			else if (publicAddress !== splitKeypairs[i].getPublicAddress()) throw new Error("splitKeypairs[" + i + "] has inconsistent public address");
		}
		
		// collect decoded hex shares and verify consistent min shares
		var minShares;
		var decodedHexShares = [];
		for (var i = 0; i < splitKeypairs.length; i++) {
			var decodedShare = decodeWifShare(splitKeypairs[i].getPrivateWif());
			assertInitialized(decodedShare);
			if (!minShares) minShares = decodedShare.minShares;
			else if (minShares !== decodedShare.minShares) throw new Error("splitKeypairs[" + i + "] has inconsistent min shares");
			decodedHexShares.push(decodedShare.hex);
		}
		
		// ensure sufficient shares provided
		if (splitKeypairs.length < minShares) {
			var additional = minShares - splitKeypairs.length;
			throw new Error("Need " + additional + " additional " + (additional === 1 ? "share" : "shares") + " to recover private key");
		}
		
		// combine hex shares
		var privateHex = secrets.combine(decodedHexShares);
		assertHex(privateHex);
		setPrivateKey(privateHex);
		setPublicAddress(publicAddress);
	}
	
	function setPublicAddress(address) {
		if (state.publicAddress === address) return;
		if (state.publicAddress) throw new Error("Cannot override known public address");
		if (that.getEncryptionScheme() === null) throw new Error("Cannot set public address of unencrypted keypair");
		assertTrue(state.plugin.isAddress(address), "Invalid address: " + address);
		state.publicAddress = address;
	}
	
	/**
	 * Decodes the given encrypted private key.
	 * 
	 * @param str is the encrypted private key to decode
	 * @returns Object with hex, wif, and encryption fields or null if not recognized
	 */
	function decodeEncryptedKey(str) {
		assertString(str);
		
		var decoded = null;
		if ((decoded = decodeEncryptedHexV0(str)) !== null) return decoded;
		if ((decoded = decodeEncryptedWifV0(str)) !== null) return decoded;
		if ((decoded = decodeEncryptedHexV1(str)) !== null) return decoded;
		if ((decoded = decodeEncryptedWifV1(str)) !== null) return decoded;
		return null;
		
		function decodeEncryptedHexV0(str) {
			
			// determine if encrypted hex V0
			if (!isHex(str)) return null;
			if (str.length % 32 !== 0) return null;
			var b64 = CryptoJS.enc.Hex.parse(str).toString(CryptoJS.enc.Base64).toString(CryptoJS.enc.Utf8);
			if (!b64.startsWith("U2")) return null;

			// decode
			var state = {};
			state.hex = str;
			state.wif = b64;
			state.encryption = AppUtils.EncryptionScheme.V0_CRYPTOJS;
			return state;
		}
		
		function decodeEncryptedWifV0(str) {
			if (!str.startsWith("U2")) return null;
			if (!isBase64(str)) return null;
			var hex = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Hex);
			return decodeEncryptedHexV0(hex);
		}
		
		function decodeEncryptedHexV1(str) {
			
			// determine if encrypted hex V1
			if (!isHex(str)) return null;
			if (str.length - 32 < 1 || str.length % 32 !== 0) return null;
			var version = parseInt(str.substring(0, AppUtils.ENCRYPTION_V1_VERSION.toString(16).length), 16);
			if (version !== AppUtils.ENCRYPTION_V1_VERSION) return null;
			
			// decode
			var state = {};
			state.hex = str;
			state.wif = Bitcoin.Base58.encode(Crypto.util.hexToBytes(str));
			state.encryption = AppUtils.EncryptionScheme.V1_CRYPTOJS;
			return state;
		}
		
		function decodeEncryptedWifV1(str) {
			if (!isBase58(str)) return null;
			var hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(str));
			return decodeEncryptedHexV1(hex);
		}
	}
	
	/**
	 * Encodes the given share with the given minimum pieces threshold.
	 * 
	 * @param share is the share hex to encode
	 * @param minShares is the minimum threshold to combine shares
	 * @returns wif encoded share
	 */
	function encodeWifShare(share, minShares) {
		assertTrue(isHex(share));
		assertTrue(isNumber(minShares) && minShares <= AppUtils.MAX_SHARES);
		return encodeShareV1(share, minShares);
		
		function encodeShareV0(share, minShares) {
			try {
				return minShares + 'c' + Bitcoin.Base58.encode(ninja.wallets.splitwallet.hexToBytes(share));
			} catch (err) {
				return null;
			}
		}
		
		function encodeShareV1(share, minShares) {
			var hex = padLeft(AppUtils.SPLIT_V1_VERSION.toString(16), 2) + padLeft(minShares.toString(16), 2) + padLeft(share, 2);
			return Bitcoin.Base58.encode(Crypto.util.hexToBytes(hex));
			
			// Pads a string `str` with zeros on the left so that its length is a multiple of `bits` (credit: bitaddress.org)
			function padLeft(str, bits){
				bits = bits || config.bits
				var missing = str.length % bits;
				return (missing ? new Array(bits - missing + 1).join('0') : '') + str;
			}
		}
	}
	
	/**
	 * Decodes the given encoded share.
	 * 
	 * @param share is the wif encoded share to decode
	 * @returns Object with minShares and hex fields or null if cannot decode
	 */
	function decodeWifShare(encodedShare) {
		if (!isString(encodedShare)) return null;
		var decoded;
		if ((decoded = decodeShareV0(encodedShare))) return decoded;
		if ((decoded = decodeShareV1(encodedShare))) return decoded;
		return null;
		
		function decodeShareV0(encodedShare) {
			try {
				if (encodedShare.length < 34) return null;
				var decoded = {};
				decoded.minShares = getMinPiecesV0(encodedShare);
				if (!decoded.minShares) return null;
				var wif = encodedShare.substring(encodedShare.indexOf('c') + 1);
				if (!isBase58(wif)) return null;
				decoded.hex = ninja.wallets.splitwallet.stripLeadZeros(Crypto.util.bytesToHex(Bitcoin.Base58.decode(wif)));
				return decoded;
			} catch (err) {
				return null;
			}
			
			/**
			 * Determines the minimum pieces to reconstitute based on a possible split piece string.
			 * 
			 * Looks for 'XXXc' prefix in the given split piece where XXX is the minimum to reconstitute.
			 * 
			 * @param splitPiece is a string which may be prefixed with 'XXXc...'
			 * @return the minimum pieces to reconstitute if prefixed, null otherwise
			 */
			function getMinPiecesV0(splitPiece) {
				var idx = splitPiece.indexOf('c');	// look for first lowercase 'c'
				if (idx <= 0) return null;
				var minShares = Number(splitPiece.substring(0, idx));	// parse preceding numbers to int
				if (!isNumber(minShares) || minShares < 2 || minShares > AppUtils.MAX_SHARES) return null;
				return minShares;
			}
		}
		
		function decodeShareV1(encodedShare) {
			if (encodedShare.length < 33) return null;
			if (!isBase58(encodedShare)) return null;
			var hex = Crypto.util.bytesToHex(Bitcoin.Base58.decode(encodedShare));
			if (hex.length % 2 !== 0) return null;
			var version = parseInt(hex.substring(0, 2), 16);
			if (version !== AppUtils.SPLIT_V1_VERSION) return null;
			var decoded = {};
			decoded.minShares = parseInt(hex.substring(2, 4), 16);
			if (!isNumber(decoded.minShares) || decoded.minShares < 2 || decoded.minShares > AppUtils.MAX_SHARES) return null;
			decoded.hex = ninja.wallets.splitwallet.stripLeadZeros(hex.substring(4));
			return decoded;
		}
	}
}

CryptoKeypair.getEncryptWeight = function(schemes) {
	schemes = listify(schemes)
	var weight = 0;
	for (var i = 0; i < schemes.length; i++) weight += getSingleEncryptWeight(schemes[i]);
	return weight;
	function getSingleEncryptWeight(scheme) {
		switch (scheme) {
			case AppUtils.EncryptionScheme.BIP38:
				return 4187;
			case AppUtils.EncryptionScheme.V0_CRYPTOJS:
				return 10;
			case AppUtils.EncryptionScheme.V1_CRYPTOJS:
				return 540;
			default: throw new Error("Unrecognized encryption scheme: " + scheme);
		}
	}
}

CryptoKeypair.getDecryptWeight = function(schemes) {
	schemes = listify(schemes);
	var weight = 0;
	for (var i = 0; i < schemes.length; i++) weight += getSingleDecryptWeight(schemes[i]);
	return weight;
	function getSingleDecryptWeight(scheme) {
		switch (scheme) {
			case AppUtils.EncryptionScheme.BIP38:
				return 4581;
			case AppUtils.EncryptionScheme.V0_CRYPTOJS:
				return 100;
			case AppUtils.EncryptionScheme.V1_CRYPTOJS:
				return 540;
			default: throw new Error("Unrecognized encryption scheme: " + scheme);
		}
	}
}