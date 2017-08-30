/**
 * Encapsulates a currency plugin public/private key pair which can be password protected and split.
 * 
 * @param plugin is the currency plugin to encapsulate a key pair for
 * @param state initializes the wallet with existing state (optional)
 */
function Wallet(plugin, state) {
	
	this.getCurrencyPlugin = function() {
		return this.plugin;
	}
	
	this.getState = function() {
		return this.state;
	}
	
	this.setState = function(state) {
		state = Object.assign({}, state);
		assertInitialized(state);
		if (state.encryption) {
			assertTrue(contains(this.plugin.getEncryptionSchemes(), state.encryption));
		}
		if (state.privateKeyPieces) {
			if (isDefined(state.isSplit)) assertTrue(state.isSplit);
			state.isSplit = true;
			assertUninitialized(state.privateKey);
			assertUninitialized(state.encryption);
		}
		if (state.isSplit) {
			assertInitialized(state.privateKeyPieces);
			assertUninitialized(state.privateKey);
		}
		if (state.privateKey) {
			if (!this.plugin.isPrivateKey(state.privateKey)) throw new Error("Invalid private key: " + state.privateKey);
			if (this.plugin.isUnencryptedPrivateKeyWif(state.privateKey)) state.privateKey = this.plugin.getUnencryptedPrivateKey(state.privateKey);
			if (state.isSplit) throw new Error("Wallet split conflicts with private key being initialized");
			state.isSplit = false;
			var encryption = this.plugin.getEncryptionScheme(state.privateKey);
			if (isDefined(state.encryption) && state.encryption != encryption) throw new Error("state.encryption does not match plugin.getEncryptionScheme(privateKey)")
			state.encryption = encryption;
			if (isUndefined(encryption)) {
				var address = this.plugin.getAddress(state.privateKey);
				if (isInitialized(state.address) && state.address !== address) throw new Error("state.address does not match plugin.getAddress(privateKey)");
				state.address = address;
			}
		}
		this.state = state;
		return this;
	}
	
	this.copy = function() {
		return new Wallet(this.plugin, this.state);
	}
	
	this.equals = function(wallet) {
		return this.toString() === wallet.toString();
	}
	
	this.random = function() {
		return this.setPrivateKey(this.plugin.newPrivateKey());
	}
	
	this.getAddress = function() {
		return this.state.address;
	}
	
	this.getPrivateKey = function() {
		return this.state.privateKey;
	}
	
	this.getUnencryptedPrivateKeyWif = function() {
		return this.plugin.getUnencryptedPrivateKeyWif(this.state.privateKey);
	}
	
	this.setPrivateKey = function(str) {
		return this.setState({privateKey: str});
	}
	
	this.getPrivateKeyPieces = function() {
		return this.state.privateKeyPieces;
	}
	
	this.setPrivateKeyPieces = function(pieces) {
		return this.setState({privateKeyPieces: pieces});
	}
	
	this.isSplit = function() {
		return this.state.isSplit;
	}
	
	this.isEncrypted = function() {
		if (this.isSplit()) return undefined;
		return isDefined(this.state.encryption);
	}
	
	this.getEncryptionScheme = function() {
		return this.state.encryption;
	}
	
	this.encrypt = function(scheme, password, callback) {
		if (this.isEncryptedPrivateKey()) throw new Error("Wallet is already encrypted");
		if (this.isSplit()) throw new Error("Wallet is split");
		if (isUndefined(this.getUnencryptedPrivateKey())) throw new Error("Wallet is not initialized");
		if (!contains(this.plugin.getEncryptionSchemes(), scheme)) throw new Error("'" + scheme + "' is not a supported encryption scheme among " + this.plugin.getEncryptionSchemes());
		this.plugin.encrypt(scheme, this.getUnencryptedPrivateKey(), password, function(resp) {
			if (resp.constructor.name === 'Error') callback(resp)
			else {
				assertEquals(scheme, that.plugin.getEncryptionScheme(resp));
				that.state.privateKey = resp;
				that.state.encryption = scheme;
				callback(that);
			}
		});
		return this;
	}
	
	this.decrypt = function(password, callback) {
		if (!this.isEncryptedPrivateKey()) throw new Error("Wallet is not encrypted");
		if (this.isSplit()) throw new Error("Wallet is split");
		if (isUndefined(this.getUnencryptedPrivateKey())) throw new Error("Wallet is not initialized");
		this.plugin.decrypt(this.getEncryptionScheme(), this.getUnencryptedPrivateKey(), password, function(resp) {
			if (resp.constructor.name === 'Error' || !that.plugin.isUnencryptedPrivateKey(resp)) callback(new Error("Invalid password"));
			else {
				assertUndefined(that.plugin.getEncryptionScheme(resp));
				that.state.privateKey = resp;
				that.state.address = that.plugin.getAddress(resp);
				that.state.encryption = undefined;
				callback(that);
			}
		});
		return this;
	}
	
	this.split = function(numPieces, minPieces) {
		assertTrue(numPieces >= 2);
		assertTrue(minPieces >= 2);
		if (this.isSplit()) throw new Error("Wallet is already split");
		if (isUndefined(this.getUnencryptedPrivateKey())) throw new Error("Wallet is not initialized");
		this.state.privateKeyPieces = this.plugin.split(this.getUnencryptedPrivateKey(), numPieces, minPieces);
		this.state.isSplit = true;
		this.state.privateKey = undefined;
		this.state.encryption = undefined;
		return this;
	}
	
	this.reconstitute = function() {
		if (!this.isSplit()) throw new Error("Wallet is not split");
		var privateKey = this.plugin.reconstitute(this.getPrivateKeyPieces());
		if (!this.plugin.isPrivateKey(privateKey)) throw new Error("Invalid private key reconstituted from pieces");
		this.state.privateKey = privateKey;
		this.state.privateKeyPieces = undefined;
		this.state.isSplit = false;
		this.state.encryption = this.plugin.getEncryptionScheme(privateKey);
		if (!this.isEncryptedPrivateKey()) {
			let address = this.plugin.getAddress(privateKey);
			if (isDefined(this.getAddress()) && this.getAddress() !== address) throw new Error("Derived address does not match original");
			this.state.address = address;
		}
		return this;
	}
	
	this.toString = function() {
		return JSON.stringify(this.state);
	}
	
	// initialize wallet
	if (!isInitialized(plugin) || typeof plugin !== 'object' || plugin.constructor.name !== 'CurrencyPlugin') throw new Error("Must provide currency plugin");
	var that = this;
	this.plugin = plugin;
	this.state = {};
	if (state) this.setState(state);
	else this.random();
}