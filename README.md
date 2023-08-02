# Alpha software

The latest version of the SDK is used in production in the Premia Interface,
but it is considered Alpha software and may contain bugs or change significantly between patch versions.
If you have questions about how to use the SDK, please reach out in the `#engineering` channel of the Discord.

Pull requests are welcome!

# Premia V3 SDK

[![Unit Tests](https://github.com/Premian-Labs/premia-v3-sdk/workflows/Unit%20Tests/badge.svg)](https://github.com/Premian-Labs/premia-v3-sdk/actions?query=workflow%3A%22Unit+Tests%22)
[![Lint](https://github.com/Premian_Labs/premia-v3-sdk/workflows/Lint/badge.svg)](https://github.com/Premian_Labs/premia-v3-sdk/actions?query=workflow%3ALint)
[![npm version](https://img.shields.io/npm/v/@premia/v3-sdk/latest.svg)](https://www.npmjs.com/package/@premia/v3-sdk/v/latest)
[![npm bundle size (scoped version)](https://img.shields.io/bundlephobia/minzip/@premia/v3-sdk/latest.svg)](https://bundlephobia.com/result?p=@premia/v3-sdk@latest)

In-depth documentation on this SDK is available at [premia.blue](https://docs.premia.blue/).

### Dev Setup

1. Add `API_KEY_ALCHEMY` and `PKEY_ETH_TEST` to a `.env` file (see example)
2. Ensure the latest ABI's are used in the `./src/abi` folder
3. Run `yarn install` to download dependencies
4. If necessary, run `chmod ug+x .husky/*` to make the husky precommit script an executable.
6. Run `yarn postinstall` to set up and install husky.

### Anvil Setup

In order to use Anvil as a local blockchain for dev purposes, Forge needs to be installed. Instructions on how to install are [here](https://mirror.xyz/crisgarner.eth/BhQzl33tthkJJ3Oh2ehAD_2FXGGlMupKlrUUcDk0ALA).

### Forking Arbitrum Goerli

1. Make sure ABI's reflect the same copy as the ones deployed on the Georli Network
2. Determine the blocknumber inwhich new contracts were deployed (fork must be _after_ this blocknumber)
3. Forking Georli -> type the following into terminal to launch anvil fork of Georli: `anvil --fork-url <INSERT RPC URL> --fork-block-number <INSERT BLOCK NUMBER>`
4. After running the fork use `ctrl + z` to pause and then type `bg` to run the fork in the background
5. Run unit test by running `yarn test` through the command line

### Contract Deployments

- 2023-08-02 (Arbitrum Goerli): ~32704676
- 2023-06-09 (Arbitrum Goerli): ~25083922
