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
 * Base plugin that each currency must implement.
 */
function CryptoPlugin() { }

/**
 * Returns the name.
 */
CryptoPlugin.prototype.getName = function() { throw new Error("Subclass must implement"); }

/**
 * Returns the ticker symbol.
 */
CryptoPlugin.prototype.getTicker = function() { throw new Error("Subclass must implement"); }

/**
 * Returns the name of the token's private component.
 */
CryptoPlugin.prototype.getPrivateLabel = function() { return "Private Key"; }

/**
 * Returns the logo.
 */
CryptoPlugin.prototype.getLogo = function() {
	return $("<img src='" + this.getLogoPath() + "'>");
}

/**
 * Returns the logo path.
 */
CryptoPlugin.prototype.getLogoPath = function() { throw new Error("Subclass must implement"); }

/**
 * Returns an array of dependency paths for the plugin.
 */
CryptoPlugin.prototype.getDependencies = function() { throw new Error("Subclass must implement"); }

/**
 * Returns the donation address associated with the currency.
 */
CryptoPlugin.prototype.getDonationAddress = function() { throw new Error("Subclass must implement"); }

/**
 * Returns the supported encryption schemes.
 */
CryptoPlugin.prototype.getEncryptionSchemes = function() { return [AppUtils.EncryptionScheme.V1_CRYPTOJS, AppUtils.EncryptionScheme.V0_CRYPTOJS]; }

/**
 * Generates and decodes a random private key.
 */
CryptoPlugin.prototype.decodeRandom = function() {
	return this.prototype.decode(this.prototype.randomPrivateKey());
}

/**
 * Returns a new keypair.
 * 
 * @param privateKey is a private key to initialize with.  Generates a random key if not given.
 * @returns a new keypair initialized from the plugin
 */
CryptoPlugin.prototype.newKeypair = function(privateKey) {
	return new CryptoKeypair({plugin: this, privateKey: privateKey});
}

/**
 * Generates a random private key in hex or wif format.
 * 
 * @returns a random private key string
 */
CryptoPlugin.prototype.randomPrivateKey = function() { throw new Error("Subclass must implement"); };

/**
 * Decodes the given private key.  Decodes a randomly generated private key if not given.
 * 
 * @param privateKey is the private key to decode (optional)
 * 
 * @returns {
 *   publicAddress: str
 *   privateHex: str
 *   privateWif: str
 *   encryption: str	// encryption scheme, null if unencrypted
 * }
 */
CryptoPlugin.prototype.decode = function(privateKey) { throw new Error("Subclass must implement"); }

/**
 * Returns the minimum unencoded private hex length.
 */
CryptoPlugin.prototype.getMinHexLength = function() { return 62; }

/**
 * Returns the maximum unencoded private hex length.
 */
CryptoPlugin.prototype.getMaxHexLength = function() { return 64; }

/**
 * Indicates if the plugin has public addresses (e.g. BIP39 does not)
 */
CryptoPlugin.prototype.isPublicApplicable = function() { return true; };

/**
 * Determines if the given string is a valid address.
 */
CryptoPlugin.prototype.isAddress = function(str) { throw new Error("Subclass must implement"); }

/**
 * Ethereum plugin.
 */
function EthereumPlugin() {
	this.getName = function() { return "Ethereum"; }
	this.getTicker = function() { return "ETH" };
	this.getLogoPath = function() { return "img/ethereum.png"; }
	this.getDependencies = function() { return ["lib/keythereum.js", "lib/ethereumjs-util.js"]; }
	this.getDonationAddress = function() { return "0x0791eB42B3864d7A56337Ea48126467982e3181C"; }
	
	this.randomPrivateKey = function() {
		return keythereum.create().privateKey.toString("hex");
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
			
		// unencrypted hex 
		if (str.length >= 63 && str.length <= 65 && isHex(str)) {
			var decoded = {};
			decoded.privateHex = str;
			decoded.privateWif = str.toLowerCase();
			decoded.publicAddress = ethereumjsutil.toChecksumAddress(keythereum.privateKeyToAddress(decoded.privateHex));
			decoded.encryption = null;
			return decoded;
		}
		
		// otherwise cannot decode
		return null;
	}
	
	this.isAddress = function(str) {
		return ethereumjsutil.isValidAddress(str);
	}
}
inheritsFrom(EthereumPlugin, CryptoPlugin);

/**
 * Ethereum classic plugin.
 */
function EthereumClassicPlugin() {
	EthereumPlugin.call(this);
	this.getName = function() { return "Ethereum Classic"; }
	this.getTicker = function() { return "ETC" };
	this.getLogoPath = function() { return "img/ethereum_classic.png"; }
	this.getDonationAddress = function() { return "0xD11d6DF296279a816f302d89A736d9ad8c9cD22c"; }
}
inheritsFrom(EthereumClassicPlugin, EthereumPlugin);

/**
 * OmiseGo plugin.
 */
function OmiseGoPlugin() {
	EthereumPlugin.call(this);
	this.getName = function() { return "OmiseGo"; }
	this.getTicker = function() { return "OMG" };
	this.getLogoPath = function() { return "img/omisego.png"; }
	this.getDonationAddress = function() { return "0xA4a8D19B0a53A38825180D20fF1928D163A57D28"; }
}
inheritsFrom(OmiseGoPlugin, EthereumPlugin);

/**
 * Basic Attention Token plugin.
 */
function BasicAttentionTokenPlugin() {
	EthereumPlugin.call(this);
	this.getName = function() { return "Basic Attention Token"; }
	this.getTicker = function() { return "BAT" };
	this.getLogoPath = function() { return "img/bat.png"; }
	this.getDonationAddress = function() { return "0xF9B2C53b16eF43216345CED86667Dd79848FbFD4"; }
}
inheritsFrom(BasicAttentionTokenPlugin, EthereumPlugin);

/**
 * Ubiq plugin.
 */
function UbiqPlugin() {
	EthereumPlugin.call(this);
	this.getName = function() { return "Ubiq"; }
	this.getTicker = function() { return "UBQ" };
	this.getLogoPath = function() { return "img/ubiq.png"; }
	this.getDonationAddress = function() { return "0xBE881cc77962f9e856cf22b205e4976590D798D8"; }
}
inheritsFrom(UbiqPlugin, EthereumPlugin);

/**
 * Monero plugin.
 */
function MoneroPlugin() {
	this.getName = function() { return "Monero"; }
	this.getTicker = function() { return "XMR" };
	this.getPrivateLabel = function() { return "Mnemonic"; }
	this.getLogoPath = function() { return "img/monero.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/moneroaddress.js"]; }
	this.getDonationAddress = function() { return "47N8VuBwAgxdy67YKrJtPcj5eM2Mh4ApQ39NippUKLsd7FLdkQFXjghKkAGqFqezH4YEHEWqxL7jjHd3JnNH5zYaKggqY7N"; }
	
	this.randomPrivateKey = function() {
		return cnUtil.sc_reduce32(cnUtil.rand_32());
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
		var decoded = {};
		
		// unencrypted wif
		if (str.indexOf(' ') !== -1) {
			try { decoded.privateHex = mn_decode(str); }
			catch (err) { return null };
			decoded.privateWif = str;
			decoded.publicAddress = cnUtil.create_address(decoded.privateHex).public_addr;
			decoded.encryption = null;
			return decoded;
		}
		
		// unencrypted hex
		else if (str.length >= 63 && str.length <= 65 && isHex(str)) {
			var address = cnUtil.create_address(str);
			if (!cnUtil.valid_keys(address.view.pub, address.view.sec, address.spend.pub, address.spend.sec)) throw new Error("Invalid address keys derived from hex key");
			decoded.privateHex = str;
			decoded.privateWif = mn_encode(decoded.privateHex, 'english');
			decoded.publicAddress = address.public_addr;
			decoded.encryption = null;
			return decoded;
		}
		
		// otherwise key is not recognized
		return null;
	}
	
	this.isAddress = function(str) {
		if (!isString(str)) return false;
		try {
			cnUtil.decode_address(str);
			return true;
		} catch (err) {
			return false;
		}
	}
}
inheritsFrom(MoneroPlugin, CryptoPlugin);

/**
 * Ripple plugin.
 */
function RipplePlugin() {
	this.getName = function() { return "Ripple"; }
	this.getTicker = function() { return "XRP" };
	this.getLogoPath = function() { return "img/ripple.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/ripple-key-pairs.js"]; }
	this.getDonationAddress = function() { return "rh8RvVwP117NhkVVVGMvQ6rx83L6WAZ5pa"; }
	this.getMinHexLength = function() { return 44; }
	this.getMaxHexLength = function() { return 44; }
	
	this.randomPrivateKey = function() {
		return ripple_key_pairs.generateSeed();
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
		var decoded = {};
		
		// unencrypted wif
		if (str.length === 29 && isBase58(str)) {
			decoded.privateHex = AppUtils.toBase(58, 16, str);
			decoded.privateWif = str;
			decoded.publicAddress = ripple_key_pairs.deriveAddress(ripple_key_pairs.deriveKeypair(str).publicKey);
			decoded.encryption = null;
			return decoded;
		}
		
		// unencrypted hex
		if (str.length === 44 && isHex(str)) {
			decoded.privateHex = str;
			decoded.privateWif = AppUtils.toBase(16, 58, str);
			decoded.publicAddress = ripple_key_pairs.deriveAddress(ripple_key_pairs.deriveKeypair(decoded.privateWif).publicKey);			
			decoded.encryption = null;
			return decoded;
		}
		
		// otherwise key is not recognized
		return null;
	}
	
	this.isAddress = function(str) {
		return isString(str) && (str.length === 33  || str.length === 34) && isBase58(str);
	}
}
inheritsFrom(RipplePlugin, CryptoPlugin);

/**
 * Stellar plugin.
 */
function StellarPlugin() {
	this.getName = function() { return "Stellar"; }
	this.getTicker = function() { return "XLM" };
	this.getLogoPath = function() { return "img/stellar.png"; }
	this.getDependencies = function() { return ["lib/bitaddress.js", "lib/stellar-base.js"]; }
	this.getDonationAddress = function() { return "GD3PABBSRLIZEOL6HKEHDLIFPG3X5PENS3FEWDDIRLBZPJV3QVZT4FSN"; }
	
	this.randomPrivateKey = function() {
		return StellarBase.Keypair.random().secret();
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
		var decoded = {};
		
		// unencrypted wif
		if (str.length === 56 && isUpperCase(str) && isBase32(str)) {
			var keypair;
			try { keypair = StellarBase.Keypair.fromSecret(str) }
			catch (err) { return null; }
			decoded.privateHex = keypair.rawSecretKey().toString('hex');
			decoded.privateWif = str;			
			decoded.publicAddress = keypair.publicKey();
			decoded.encryption = null;
			return decoded;
		}

		// unencrypted hex
		if (str.length === 64 && isHex(str)) {
			var rawSecret = new Uint8Array(Crypto.util.hexToBytes(str));
			var keypair = StellarBase.Keypair.fromRawEd25519Seed(rawSecret);
			decoded.privateHex = str;
			decoded.privateWif = keypair.secret();
			decoded.publicAddress = keypair.publicKey();
			decoded.encryption = null;
			return decoded;
		}
		
		// otherwise key is not recognized
		return null;
	}
	
	this.isAddress = function(str) {
		return isString(str) && isUpperCase(str) && str.length === 56 && isBase32(str);
	}
}
inheritsFrom(StellarPlugin, CryptoPlugin);

/**
 * BIP39 plugin.
 */
function BIP39Plugin() {
	this.getName = function() { return "BIP39"; }
	this.getTicker = function() { return "BIP39" };
	this.getPrivateLabel = function() { return "Mnemonic"; }
	this.getLogoPath = function() { return "img/usb.png"; }
	this.getDependencies = function() { return ["lib/bip39.js"]; }
	this.getDonationAddress = function() { return null; }
	this.isPublicApplicable = function() { return false; }
	this.getMinHexLength = function() { return 66; }
	this.getMaxHexLength = function() { return 66; }
	
	var mnemonic;
	var language = "english";
	
	this.randomPrivateKey = function() {
		if (!mnemonic) mnemonic = new Mnemonic(language);
		return mnemonic.generate(256);
	}
	
	this.decode = function(str) {

		// initialize
		assertString(str);
		assertInitialized(str);
		var wordlist = WORDLISTS[language];
		var shamir39 = new Shamir39();
		if (!mnemonic) mnemonic = new Mnemonic(language);
		var decoded = {publicAddress: null};
		
		// unencrypted wif
		if (mnemonic.check(str)) {
			decoded.privateHex = shamir39.getHexFromWords(mnemonic.splitWords(str), wordlist);
			decoded.privateWif = str;
			decoded.encryption = null;
			return decoded;
		}
		
		// unencrypted hex
		if (str.length === 66 && isHex(str)) {
			decoded.privateHex = str;
			decoded.privateWif = mnemonic.joinWords(shamir39.getWordsFromHex(str, wordlist));
			decoded.encryption = null;
			return decoded;
		}
		
		// unrecognized bip39 wif or hex phrase
		return null;
	}
	
	this.isAddress = function(str) {
		return str === null;
	}
}
inheritsFrom(BIP39Plugin, CryptoPlugin);

/**
 * Waves plugin.
 */
function WavesPlugin() {
	this.getName = function() { return "Waves"; }
	this.getTicker = function() { return "WAVES" };
	this.getPrivateLabel = function() { return "Mnemonic"; }
	this.getLogoPath = function() { return "img/waves.png"; }
	this.getDependencies = function() { return ["lib/bip39.js", "lib/polyfill.js", "lib/waves-api.js"]; }
	this.getDonationAddress = function() { return "3PEXKKMfn8MssQie4UAngidff53eznYi5iW"; }
	this.getMinHexLength = function() { return 42; }
	this.getMaxHexLength = function() { return 42; }
	
	var waves;
	
	this.randomPrivateKey = function() {
		if (!waves) waves = WavesAPI.create(WavesAPI.MAINNET_CONFIG);
		return waves.Seed.create().phrase;
	}
	
	this.decode = function(str) {
		
		// initialize
		assertString(str);
		assertInitialized(str);
		if (!waves) waves = WavesAPI.create(WavesAPI.MAINNET_CONFIG);
		var wordlist = waves.Seed.getSeedDictionary();
		var shamir39 = new Shamir39();
		var decoded = {};

		// unencrypted wif
		if (str.indexOf(' ') !== -1 && str.split(' ').length === 15) {
			decoded.privateHex = shamir39.getHexFromWords(str.split(' '), wordlist);
			decoded.privateWif = str;
			decoded.publicAddress = waves.Seed.fromExistingPhrase(decoded.privateWif).address;
			decoded.encryption = null;
			return decoded;
		}
		
		// unencrypted hex
		if (str.length >= this.getMinHexLength() && str.length <= this.getMaxHexLength() && isHex(str)) {
			decoded.privateHex = str;
			decoded.privateWif = shamir39.getWordsFromHex(str, wordlist).join(' ');
			decoded.publicAddress = waves.Seed.fromExistingPhrase(decoded.privateWif).address;
			decoded.encryption = null;
			return decoded;
		}
		
		// unrecognized wif or hex
		return null;
	}
	
	this.isAddress = function(str) {
		var Waves = WavesAPI.create(WavesAPI.MAINNET_CONFIG);
		try {
			return Waves.crypto.isValidAddress(str);
		} catch (err) {
			return false;;
		}
	}
}
inheritsFrom(WavesPlugin, CryptoPlugin);

/**
 * Neo plugin.
 */
function NeoPlugin() {
	this.getName = function() { return "Neo"; }
	this.getTicker = function() { return "NEO" };
	this.getLogoPath = function() { return "img/neo.png"; }
	this.getDependencies = function() { return ["lib/neon.js"]; }
	this.getDonationAddress = function() { return "AJQpHPQZQamguoRWNvycXpEkrNkasz5YZi"; }
	
	this.randomPrivateKey = function() {
		return Neon.wallet.generatePrivateKey();
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
		var decoded = {};
		
		// unencrypted wif
		if (Neon.wallet.isWIF(str)) {
			decoded.privateHex = Neon.wallet.getPrivateKeyFromWIF(str);
			decoded.privateWif = str;
			decoded.publicAddress = Neon.wallet.getAddressFromScriptHash(Neon.wallet.getScriptHashFromPublicKey(Neon.wallet.getPublicKeyFromPrivateKey(decoded.privateHex)));
			decoded.encryption = null;
			return decoded;
		}
		
		// unencrypted hex
		if (str.length === 64 && isHex(str)) {
			decoded.privateHex = str;
			decoded.privateWif = Neon.wallet.getWIFFromPrivateKey(decoded.privateHex);
			decoded.publicAddress = Neon.wallet.getAddressFromScriptHash(Neon.wallet.getScriptHashFromPublicKey(Neon.wallet.getPublicKeyFromPrivateKey(decoded.privateHex)));
			decoded.encryption = null;
			return decoded;
		}
		
		// unrecognized wif or hex
		return null;
	}
	
	this.isAddress = function(str) {
		return Neon.wallet.isAddress(str);
	}
}
inheritsFrom(NeoPlugin, CryptoPlugin);

/**
 * Plugin that generates keypairs using BitcoinJS and pluggable networks (LTC, DASH, DOGE, etc).
 * 
 * @param ticker identifies the network to generate keypairs for
 */
function BitcoinJsPlugin(ticker) {
	CryptoPlugin.call(this);
	assertDefined(BitcoinJsPlugins[ticker], "BitcoinJsPlugin[" + ticker + "] not defined");
	
	var that = this;
	var language = "english";
	var mnemonic;
	var network;
	
	this.getName = function() { return BitcoinJsPlugins[ticker].name; }
	this.getTicker = function() { return ticker };
	this.getLogoPath = function() { return BitcoinJsPlugins[ticker].logoPath; }
	this.getDependencies = function() { return ["lib/bitcoinjs-3.3.2.js"]; }
	this.getDonationAddress = function() { return BitcoinJsPlugins[ticker].donationAddress }
	
	// initialize encryption schemes
	if (BitcoinJsPlugins[ticker].encryptionSchemes) {
		this.getEncryptionSchemes = function() { return BitcoinJsPlugins[ticker].encryptionSchemes; }
	}
	
	this.getNetwork = function() {
		if (!network) network = bitcoinjs.bitcoin.networks[BitcoinJsPlugins[ticker].bitcoinjsNetwork];
		assertDefined(network, "bitcoinjs.bitcoin.networks[" + BitcoinJsPlugins[ticker].bitcoinjsNetwork + "] not defined");
		return network;
	}
	
	this.randomPrivateKey = function() {
		return bitcoinjs.bitcoin.ECPair.makeRandom({network: this.getNetwork(), compressed: BitcoinJsPlugin.COMPRESSED_KEYPAIRS}).toWIF();
	}
	
	this.decode = function(str) {
		assertString(str);
		assertInitialized(str);
		var decoded = {};
		
		// bip38 wif
		if (AppUtils.isBIP38Format(str)) {
			decoded.privateWif = str;
			decoded.privateHex = AppUtils.toBase(58, 16, str);
			decoded.publicAddress = undefined;
			decoded.encryption = AppUtils.EncryptionScheme.BIP38;
			return decoded;
		}
		
		// bip38 hex
		if (str.length > 80 && str.length < 90 && str.length % 2 === 0 && isHex(str)) {
			return that.decode(AppUtils.toBase(16, 58, str));
		}
		
		// unencrypted
		try {
	    var keypair;
			
			// build compressed keypair from hex
			if (str.length % 2 === 0 && str.length >= this.getMinHexLength() && str.length <= this.getMaxHexLength() && isHex(str)) {
			  keypair = bitcoinjs.bitcoin.ECPair.fromUncheckedHex(str, this.getNetwork(), BitcoinJsPlugin.COMPRESSED_KEYPAIRS);
			}
			
			// build compressed keypair from wif
			else {
			  keypair = bitcoinjs.bitcoin.ECPair.fromWIF(str, this.getNetwork());
			  keypair = new bitcoinjs.bitcoin.ECPair(keypair.d, null, {compressed: BitcoinJsPlugin.COMPRESSED_KEYPAIRS, network: this.getNetwork()});
			}
			
			// decode
			decoded.privateWif = keypair.toWIF();
			decoded.privateHex = keypair.toUncheckedHex();
			decoded.publicAddress = keypair.getAddress().toString();
			decoded.encryption = null;
			return decoded;
		} catch (err) {
			return null;	// unrecognized private key
		}
	}
	
	this.isAddress = function(str) {
		try {
			bitcoinjs.bitcoin.address.fromBase58Check(str, that.getNetwork());
			return true;
		} catch (err) {
			return false;
		}
	}
}
inheritsFrom(BitcoinJsPlugin, CryptoPlugin);

/**
 * Specifies if keypairs generated with the BitcoinJS plugin should be compressed or not including BIP38.
 */
BitcoinJsPlugin.COMPRESSED_KEYPAIRS = true;

/**
 * Enumerates plugins using CryptoJS and pluggable networks.
 */
var BitcoinJsPlugins = {
		"BTC": {
			name: "Bitcoin-BTC",
			logoPath: "img/bitcoin.png",
			donationAddress: "1MbUDLYixvjifi4kbbK56HS86PpBEoibs6",
			bitcoinjsNetwork: "bitcoin",
			encryptionSchemes: [AppUtils.EncryptionScheme.V1_CRYPTOJS, AppUtils.EncryptionScheme.BIP38, AppUtils.EncryptionScheme.V0_CRYPTOJS]
		},
		"LTC": {
			name: "Litecoin",
			logoPath: "img/litecoin.png",
			donationAddress: "LhHSM8foAxQbHF6hauckXG3XhxMR4By7fu",
			bitcoinjsNetwork: "litecoin",
		},
		"DASH": {
			name: "Dash",
			logoPath: "img/dash.png",
			donationAddress: "Xdfrd2fqG672EP4unvr3Ft3dDemv1pyvAB",
			bitcoinjsNetwork: "dash",
		},
		"ZEC": {
			name: "Zcash",
			logoPath: "img/zcash.png",
			donationAddress: "t1Y9Pz37u4A4uJyznj4DaJ9EVPU3b23k1gN",
			bitcoinjsNetwork: "zcash",
		},
		"DOGE": {
			name: "Dogecoin",
			logoPath: "img/dogecoin.png",
			donationAddress: "D8jdrFpGNgb5FBdSCShDZXgSEphTiG7akp",
			bitcoinjsNetwork: "dogecoin",
		},
		"XZC": {
			name: "Zcoin",
			logoPath: "img/zcoin.png",
			donationAddress: "aNJQsvAVX7LPqvuCyGRNseuFvDr6wNjxFF",
			bitcoinjsNetwork: "zcoin",
		}
};

/**
 * Bitcoin Cash plugin.
 */
function BitcoinCashPlugin() {
	BitcoinJsPlugin.call(this, "BTC");
	var bitcoinPlugin = new BitcoinJsPlugin("BTC");
	this.getName = function() { return "Bitcoin-BCH"; }
	this.getTicker = function() { return "BCH" };
	this.getLogoPath = function() { return "img/bitcoin_cash.png"; }
	this.getDependencies = function() { return ["lib/bchaddrjs-0.1.4.js"]; }
	this.getDonationAddress = function() { return "qpvuy08ccfn60w89najyt23r43dmskqe6549nygf7p"; }
	
	this.randomPrivateKey = function() {
		return bitcoinPlugin.randomPrivateKey();
	}
	
	this.decode = function(str) {
		var decoded = bitcoinPlugin.decode(str);
		if (!decoded) return null;
		if (!decoded.publicAddress) return decoded;
		var cashAddr =  bchaddr.toCashAddress(decoded.publicAddress);
		decoded.publicAddress = cashAddr.substring(cashAddr.indexOf(':') + 1);
		return decoded;
	}
	
	this.isAddress = function(str) {
		if (bitcoinPlugin.isAddress(str)) return true;
		try {
			return bchaddr.isCashAddress(str);
		} catch (err) {
			return false;
		}
	}
}
inheritsFrom(BitcoinCashPlugin, BitcoinJsPlugin);