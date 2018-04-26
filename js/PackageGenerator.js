/**
 * Generates a CryptoPackage and/or rendered PieceRenderers.
 *  
 * @param config specifies package generation configuration
 * 				config.passphrase causes encryption with this field as the passphrase
 *  			config.useBip38 specifies whether or not to use BIP38 when available, otherwise uses first registered encryption scheme
 * 				config.numPieces causes splitting with this field as the number of split pieces
 * 				config.minPieces specifies the minimum number of split pieces necessary to reconstitute private keys
 * 				config.keypairs[{ticker: "BCH", numKeypairs: 7}, ...] specifies the keypair generation configuration
 * 				config.piecePkg is an existing package to start with instead of generating new keypairs
 * 				config.pieceRendererClass specifies a class to render pieces, skips rendering if not given
 */
function PackageGenerator(config) {
	
	config = Object.assign({}, config);
	PackageGenerator.validateGenerateConfig(config);

	/**
	 * Generates a package and/or piece renderers according to the config.
	 * 
	 * @param onProgress(percent, label) is invoked as progress is made
	 * @param onDone(err, piecePkg, pieceRenderers) is invoked when done
	 */
	this.generatePackage = function(onProgress, onDone) {
		
		// get weights
		var createWeight = getCreateWeight();
		var encryptWeight = getEncryptWeight();
		var splitWeight = getSplitWeight();
		var renderWeight = getRenderWeight();
		var totalWeight = createWeight + encryptWeight + splitWeight + renderWeight;
		
		// create unencrypted package
		var doneWeight = 0;
		create(function(percent, label) {
			if (onProgress) onProgress((doneWeight + percent * createWeight) / totalWeight, label);
		}, function(err, pkg) {
			assertNull(err);
			doneWeight += createWeight;
			
			// encrypt
			encrypt(pkg, function(percent, label) {
				if (onProgress) onProgress((doneWeight + percent * encryptWeight) / totalWeight, label);
			}, function(err, pkg) {
				assertNull(err);
				doneWeight += encryptWeight;
				
				// split
				split(pkg, function(percent, label) {
					if (onProgress) onProgress((doneWeight + percent * splitWeight) / totalWeight, label);
				}, function(err, pkg) {
					assertNull(err);
					doneWeight += splitWeight;
					
					// render
					render(pkg, function(percent, label) {
						if (onProgress) onProgress((doneWeight + percent * renderWeight) / totalWeight, label);
					}, function(err, pieceRenderers) {
						assertNull(err);
						doneWeight += renderWeight;
						assertEquals(doneWeight, totalWeight);
						if (onDone) onDone(null, pkg, pieceRenderers);
					});
				});
			});
		});
	}
	
	this.cancel = function() {
		throw new Error("Not implemented");
	}
	
	// --------------------------------- PRIVATE --------------------------------
	
	function getCreateWeight() {
		throw new Error("Not implemented");
	}
	
	function create(onProgress, onDone) {
		throw new Error("Not implemented");
	}
	
	function getEncryptWeight() {
		throw new Error("Not implemented");
	}
	
	function encrypt(pkg, onProgress, onDone) {
		throw new Error("Not implemented");
	}
	
	function getSplitWeight() {
		throw new Error("Not implemented");
	}
	
	function split(pkg, onProgress, onDone) {
		throw new Error("Not implemented");
	}
	
	function getRenderWeight() {
		throw new Error("Not implemented");
	}
	
	function render(pkg, onProgress, onDone) {
		throw new Error("Not implemented");
	}
}

/**
 * Validates a package generation config.
 */
PackageGenerator.validateGenerateConfig = function(genConfig) {
	
}