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
 * Encapsulates a 'piece' which is a collection of keypairs.
 * 
 * Initializes from the first non-null argument.
 * 
 * @param config specifies initialization configuration
 * 				config.keypairs keypairs are keypairs to initialize with
 * 				config.json is json to initialize from
 * 				config.csv is csv to initialize from
 * 				config.splitPieces are split pieces to combine and initialize from
 * 				config.piece is an existing piece to copy from
 *  			config.pieceNum is the pieceNumber to assign to each piece (optional)
 */
function CryptoPiece(config) {
	
	var that = this;
	var state;
		
	this.getKeypairs = function() {
		return state.keypairs;
	}
	
	this.encrypt = function(passphrase, schemes, onProgress, onDone, verifyEncryption) {
		
		// verify input
		try {
			assertInitialized(passphrase);
			assertEquals(state.keypairs.length, schemes.length);
			assertInitialized(onDone);
		} catch (err) {
			onDone(err);
			return;
		}
		
		// collect originals if verifying encryption
		var originals;
		if (verifyEncryption) {
			originals = [];
			for (var i = 0; i < state.keypairs.length; i++) {
				originals.push(state.keypairs[i].copy());
			}
		}
		
		// track weights for progress
		var doneWeight = 0;
		var verifyWeight = verifyEncryption ? CryptoKeypair.getDecryptWeight(schemes) : 0;
		var totalWeight = CryptoKeypair.getEncryptWeight(schemes) + verifyWeight;
		
		// collect encryption functions
		var funcs = [];
		for (var i = 0; i < state.keypairs.length; i++) {
			funcs.push(encryptFunc(state.keypairs[i], schemes[i], passphrase));
		}
		
		// encrypt async
		if (onProgress) onProgress(0, "Encrypting");
		async.parallelLimit(funcs, AppUtils.ENCRYPTION_THREADS, function(err, encryptedKeypairs) {
			
			// check for error
			if (err) {
				onDone(err);
				return;
			}
			
			// verify encryption
			if (verifyEncryption) {
				
				// copy encrypted keypairs
				var encryptedCopies = [];
				for (var i = 0; i < encryptedKeypairs.length; i++) {
					encryptedCopies.push(encryptedKeypairs[i].copy());
				}
				
				// decrypt keypairs
				if (onProgress) onProgress(doneWeight / totalWeight, "Verifying encryption");
				AppUtils.decryptKeys(encryptedCopies, passphrase, null, function(percent) {
					if (onProgress) onProgress((doneWeight + percent * verifyWeight) / totalWeight, "Verifying encryption");
				}, function(err, decryptedKeys) {
					try {
						
						// check for error
						if (err) throw err;
						
						// assert originals match decrypted keypairs
						doneWeight += verifyWeight;
						assertEquals(originals.length, decryptedKeys.length);
						for (var j = 0; j < originals.length; j++) {
							assertTrue(originals[j].equals(decryptedKeys[j]));
						}
						
						// done
						onDone(null, that);
					} catch (err) {
						onDone(err);
					}
				})
			}
			
			// don't verify encryption
			else {
				onDone(err, that);
			}
		});
		
		function encryptFunc(keypair, scheme, passphrase) {
			return function(onDone) {
				keypair.encrypt(scheme, passphrase, function(percent) {
					if (onProgress) onProgress((doneWeight +  CryptoKeypair.getEncryptWeight(scheme) * percent) / totalWeight, "Encrypting");
				}, function(err, keypair) {
					if (err) onDone(err);
					else {
						assertTrue(keypair.isEncrypted());
						doneWeight += CryptoKeypair.getEncryptWeight(scheme);
						if (onProgress) onProgress(doneWeight / totalWeight, "Encrypting");
						setImmediate(function() { onDone(null, keypair); });	// let UI breath
					}
				});
			}
		}
	}
	
	this.isEncrypted = function() {
		var bool = -1;
		for (var i = 0; i < state.keypairs.length; i++) {
			if (bool === -1) bool = state.keypairs[i].isEncrypted();
			else if (bool !== state.keypairs[i].isEncrypted()) throw new Error("state.keypairs[" + i + "] encryption is inconsistent");
		}
		return bool;
	}
	
	this.decrypt = function(passphrase, onProgress, onDone) {

		// validate input
		try {
			assertTrue(state.keypairs.length > 0);
			assertInitialized(passphrase);
			assertInitialized(onDone);
		} catch (err) {
			onDone(err);
			return;
		}
		
		// compute total weight
		var totalWeight = 0;
		for (var i = 0; i < state.keypairs.length; i++) {
			totalWeight += CryptoKeypair.getDecryptWeight(state.keypairs[i].getEncryptionScheme());
		}
		
		// decrypt keys
		var funcs = [];
		for (var i = 0; i < state.keypairs.length; i++) funcs.push(decryptFunc(state.keypairs[i], passphrase));
		var doneWeight = 0;
		if (onProgress) onProgress(0, "Decrypting");
		async.parallelLimit(funcs, AppUtils.ENCRYPTION_THREADS, function(err, encryptedKeypairs) {
			if (err) {
				onDone(err);
				return;
			} else {
				onDone(null, that);
			}
		});
		
		// decrypts one key
		function decryptFunc(keypair, passphrase) {
			return function(onDone) {
				var scheme = keypair.getEncryptionScheme();
				keypair.decrypt(passphrase, function(percent) {
					if (onProgress) onProgress((doneWeight + CryptoKeypair.getDecryptWeight(scheme) * percent) / totalWeight, "Decrypting");
				}, function(err, encryptedKeypair) {
					if (err) {
						onDone(err);
						return;
					} else {
						doneWeight += CryptoKeypair.getDecryptWeight(scheme);
						if (onProgress) onProgress(doneWeight / totalWeight);
						setImmediate(function() { onDone(err, encryptedKeypair); });	// let UI breath
					}
				});
			}
		}
	}
	
	this.split = function(numShares, minShares) {
		
		// collect all split keypairs
		var allSplitKeypairs = [];
		for (var i = 0; i < numShares; i++) allSplitKeypairs.push([]);
		for (var i = 0; i < state.keypairs.length; i++) {
			var splitKeypairs = state.keypairs[i].split(numShares, minShares);
			for (var j = 0; j < splitKeypairs.length; j++) {
				allSplitKeypairs[j].push(splitKeypairs[j]);
			}
		}
		
		// build split pieces
		var splitPieces = [];
		for (var i = 0; i < allSplitKeypairs.length; i++) {
			splitPieces.push(new CryptoPiece({keypairs: allSplitKeypairs[i]}));
		}
		return splitPieces;
	}
	
	this.isSplit = function() {
		assertTrue(state.keypairs.length > 0);
		var split = -1;
		for (var i = 0; i < state.keypairs.length; i++) {
			if (split === -1) split = state.keypairs[i].isSplit();
			else if (split !== state.keypairs[i].isSplit()) throw new Error("keypair[" + i + "] has an inconsistent split state");
		}
		return split;
	}
	
	this.getPieceNum = function() {
		assertTrue(state.keypairs.length > 0);
		var pieceNum = -1;
		for (var i = 0; i < state.keypairs.length; i++) {
			if (pieceNum === -1) pieceNum = state.keypairs[i].getShareNum();
			else if (pieceNum !== state.keypairs[i].getShareNum()) throw new Error("keypair[" + i + "] has an inconsistent share num");
		}
		return pieceNum;
	}
	
	this.toJson = function() {
		var json = {};
		json.pieceNum = that.getPieceNum();
		json.version = AppUtils.VERSION;
		json.keypairs = [];
		for (var i = 0; i < state.keypairs.length; i++) {
			json.keypairs.push(state.keypairs[i].toJson());
		}
		return json;
	}
	
	this.copy = function() {
		var keypairCopies = [];
		for (var i = 0; i < state.keypairs.length; i++) keypairCopies.push(state.keypairs[i].copy());
		return new CryptoPiece({keypairs: keypairCopies});
	}
	
	this.equals = function(piece) {
		assertObject(piece, CryptoPiece);
		return objectsEqual(that.toJson(), piece.toJson());
	}
	
	this.getState = function() {
		return state;
	}
	
	// -------------------------------- PRIVATE ---------------------------------
	
	init();
	function init() {
		state = {};
		if (config.keypairs) setKeypairs(config.keypairs);
		else if (config.json) fromJson(config.json);
		else if (config.splitPieces) combine(config.splitPieces);
		else if (config.piece) fromPiece(config.piece);
		else throw new Error("All arguments null");
	}
	
	function setKeypairs(keypairs) {
		assertTrue(keypairs.length > 0);
		for (var i = 0; i < keypairs.length; i++) {
			assertObject(keypairs[i], CryptoKeypair);
		}
		state.keypairs = keypairs;
	}
	
	function fromJson() {
		throw new Error("Not implemented");
	}
	
	function combine(splitPieces) {
		
		// verify consistent num keypairs
		var numKeypairs;
		for (var i = 0; i < splitPieces.length; i++) {
			if (!numKeypairs) numKeypairs = splitPieces[i].getKeypairs().length;
			else if (numKeypairs !== splitPieces[i].getKeypairs().length) throw new Error("config.splitPieces[" + i + "].getKeypairs() has inconsistent number of keypairs");
		}
		assertTrue(numKeypairs > 0);
		
		// combine keypairs
		var combinedKeypairs = [];
		for (var i = 0; i < numKeypairs; i++) {
			var splitKeypairs = [];
			for (var j = 0; j < splitPieces.length; j++) splitKeypairs.push(splitPieces[j].getKeypairs()[i]);
			combinedKeypairs.push(new CryptoKeypair({splitKeypairs: splitKeypairs}));
		}
		
		// set keypairs to combined keypairs
		setKeypairs(combinedKeypairs);
	}
	
	function fromPiece() {
		throw new Error("Not implemented");
	}
}