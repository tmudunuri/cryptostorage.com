/**
 * Invoked when document initialized.
 */
$(document).ready(function() {
	
	// welcome :)
	console.log("Hey there!  Find an issue?  Let us know!  Submit an issue at https://github.com/cryptostorage/cryptostorage.com/issues");
	
	// catch unexpected errors
	window.onerror = function(err) {
		AppUtils.setRuntimeError(err);
		throw err;
	};

	// assign window.crypto (supports IE11)
	window.crypto = window.crypto || window.msCrypto;
		
	// delete window.crypto for testing
	if (AppUtils.DELETE_WINDOW_CRYPTO) delete window.crypto;
	
	// render application to html body
	new AppController($("body")).render(function() {
		
		// run tests
		LOADER.load(AppUtils.getAppDependencies(), function(err) {
			if (err) throw err;
				
			// run minimum tests
			AppUtils.runMinimumTests(function(err) {
				if (err) throw err;
				console.log("Minimum tests pass");
			});
			
			// run test suite
			if (AppUtils.RUN_TESTS) {
				console.log("Running tests...");
				Tests.runTests(function(err) {
					if (err) throw error;
					console.log("All tests pass");
				});
			}
		});
	});
});