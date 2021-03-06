# Introduction
CryptoStorage is an open source tool to generate offline storage for multiple cryptocurrencies.  This tool generates [keypairs](https://cryptostorage.com/#faq_keypair) in your device's browser which can store cryptocurrency without exposing private keys to an internet-connected device.  Generated key pairs can be easily printed and saved to digital files for long-term storage.

This tool is security-focused.  Funds are never entrusted to a third party.  Private keys can be passphrase-protected and [divided into parts](https://cryptostorage.com/#faq_divide_meaning) which can be geographically separated so funds are not accessible at any one location.  Recommendations are automatically provided to improve the security of the tool's environment.

# Main Features
- Generate offline storage for multiple cryptocurrencies.
- 100% open source, client-side, and free to use.  No account necessary.
- Keypairs are generated only in your browser so funds are never untrusted to a third party.
- Private keys can be passphrase-protected using [CryptoJS](https://github.com/brix/crypto-js).  Also supports [BIP38](https://github.com/bitcoin/bips/blob/master/bip-0038.mediawiki) for Bitcoin and Bitcoin Cash.
- Import existing keys (e.g. BIP39 hardware wallet seeds) and re-export with passphrase encryption and division.
- Storage can be divided into parts which can be geographically separated so funds are not accessible at any one location.
- Import and export as JSON, CSV, and TXT.
- Print to different layouts (Standard, Grid, Text, and CryptoCash to tip people in real life).
- Recommendations are automatically provided to improve the security of the tool's environment:
	- Checks if the internet connection is active
	- Checks if the tool is downloaded and running locally
	- Checks if the browser is open source
	- Checks if the operating system is open source
	
# Supported Tokens
- Bitcoin
- Bitcoin Cash
- Ethereum
- Monero
- Litecoin
- Dogecoin
- Neo
- Dash
- Zcoin
- Zcash
- Waves
- Stellar
- Ripple
- Ethereum Classic
- OmiseGo
- Basic Attention token
- BIP39
- Ubiq

# Using this Tool as Securely as Possible

Security is a spectrum.  The following procedure is recommended to use this tool as securely as possible:

1. [Download and verify the source code.](#download-and-verify-the-source-code)
2. Transfer cryptostorage.com-*[version]*.zip to a secure computer using a flash drive.
    - The computer should be disconnected from the internet and ideally will never connect to the internet again.
    - An open source operating system is recommended like [Tails](https://tails.boum.org), [Debian](https://www.debian.org/), or [Raspbian for the Raspberry Pi](https://www.raspberrypi.org).
3. Unzip cryptostorage.com-*[version]*.zip.
4. Open index.html in the unzipped folder in a browser.
    - An open source browser is recommended like [Firefox](https://www.mozilla.org/en-US/firefox/) or [Chromium](https://www.chromium.org/getting-involved/download-chromium).
5. Confirm that all environment checks pass.
    1. Go to Generate New Keys from the homepage.
    2. The notice bar at the top should indicate that all security checks pass.
6. Fill out the form and click the Generate button.
    - Protecting your keys with a passphrase is *highly recommended*.  Otherwise anyone in possession of the unencrypted keys can access the funds.
    - Optionally divide your keys for maximum security.
7. Save the generated keypairs to flash drives and/or print to paper. Geographic redundancy is highly recommended so there are backup copies at other locations if one location is lost due to fire, theft, etc.
8. The keypairs can be imported at any time by relaunching this tool in a secure environment.
 
⚠ Do not lose the generated keypairs or the passphrase or all funds will be lost.

⚠ Many printers retain a copy of printed documents which cannot be deleted easily but can be accessed with the proper tools. For maximum security, the printer or other hardware which may retain your sensitive data should be destroyed.

# Download and Verify the Source Code
Verifying the source code ensures you have a copy of this tool that has been publicly reviewed and has not been modified by an attacker.

Downloading and verifying the source code is *highly recommended* but not required to use this tool.

The source code can be verified in two ways. Either method is sufficient.

## Method #1: Verify the source code has the correct checksum.

1. Download cryptostorage-*[version]*.zip and cryptostorage-*[version]*-checksum.txt from the [latest release on GitHub](https://github.com/cryptostorage/cryptostorage.com/releases).
2. Determine the SHA256 hash of the zip file.  Instructions depend on your operating system.<br>
 Linux: `sha256sum cryptostorage-[version].zip`<br>
 Mac: `openssl sha -sha256 cryptostorage-[version].zip`<br>
 Windows: `certUtil -hashfile cryptostorage-[version].zip SHA256`
3. Verify that the checksum matches the contents of the previously downloaded cryptostorage-*[version]*-checksum.txt.

## Method #2: Verify the source code has been signed by the developer's PGP key.

1. Install [PGP software](https://www.openpgp.org/) on your device.
2. Download the developer's public PGP key, "woodser.asc", from the [root of the GitHub source repository](https://github.com/cryptostorage/cryptostorage.com).
3. Import the PGP key: `gpg --import woodser.asc`
4. Download cryptostorage-*[version]*.zip, cryptostorage-*[version]*.sig, and woodser-pgp-fingerprint.txt from the [latest release on GitHub](https://github.com/cryptostorage/cryptostorage.com/releases).
5. Verify the signature of cryptostorage-*[version]*.zip:
    ```
    gpg --verify cryptostorage-[version].sig cryptostorage-[version].zip
    ```
    You should see output with this RSA key:<br>
    ```
    gpg: Signature made Fri Jan 12 09:22:37 2018 EST
    gpg: using RSA key 52FD7C01877CA968C97118D055A10DD48ADEE5EF
    gpg: Good signature ...
    ```
    The RSA key will also match the contents of the previously downloaded woodser-pgp-fingerprint.txt.<br><br>
    Note: You will probably also see a warning that the key is not certified with a trusted signature. This is expected unless you told PGP to trust woodser’s PGP key, which is not necessary.

# Frequently Asked Questions
Please see https://cryptostorage.com/#faq.

# Contact

For bug reports and feature requests, please submit an issue to https://github.com/cryptostorage/cryptostorage.com/issues.

For community discussion, please join the conversation on Reddit at https://reddit.com/r/cryptostorage.

For email support, please email [support@cryptostorage.com](mailto:support@cryptostorage.com).

*No one can recover lost keys or passwords for you. Do not lose these or your funds will be lost.*

# Contribute
All contributions to make this project better are welcome.

Supported tokens need to meet criteria which generally indicate active development and use.

The domain cryptostorage.com will retain ownership of donation addresses for supported coins.

# License
This project is [MIT](https://github.com/cryptostorage/cryptostorage.com/blob/master/LICENSE.txt) licensed.

# Donate
Donations are gratefully accepted to support this project.

Please see https://cryptostorage.com/#donate for donation addresses.