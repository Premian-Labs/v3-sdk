# Alpha software

The latest version of the SDK is used in production in the Premia Interface,
but it is considered Alpha software and may contain bugs or change significantly between patch versions.
If you have questions about how to use the SDK, please reach out in the `#engineering` channel of the Discord.

Pull requests are welcome!

# Premia V3 SDK

[![Tests](https://github.com/Premian-Labs/v3-sdk/workflows/test/badge.svg)](https://github.com/Premian-Labs/v3-sdk/actions?query=workflow%3Atest)
[![Published](https://github.com/Premian-Labs/v3-sdk/workflows/publish/badge.svg)](https://github.com/Premian-Labs/v3-sdk/actions?query=workflow%3Apublish)
[![npm version](https://img.shields.io/npm/v/@premia/v3-sdk/latest.svg)](https://www.npmjs.com/package/@premia/v3-sdk/v/latest)
[![npm bundle size (scoped version)](https://img.shields.io/bundlephobia/minzip/@premia/v3-sdk/latest.svg)](https://bundlephobia.com/result?p=@premia/v3-sdk@latest)

In-depth documentation on this SDK is available at [docs.premia.blue](https://docs.premia.blue/).

Auto-generated documentation is available at [docs-sdk.premia.finance](https://docs-sdk.premia.finance/).

Feedback is welcome!

### Dev Setup

1. Add `API_KEY_ALCHEMY`, `API_KEY_INFURA` and `TESTNET_PRIVATE_KEY` to a `.env` file (see example)
2. Run `yarn install` to download dependencies
3. If necessary, run `chmod ug+x .husky/*` to make the husky precommit script an executable.

### Anvil Setup

In order to use Anvil as a local blockchain for dev purposes, Forge needs to be installed. Instructions on how to install are [here](https://mirror.xyz/crisgarner.eth/BhQzl33tthkJJ3Oh2ehAD_2FXGGlMupKlrUUcDk0ALA).

### Forking Arbitrum Goerli

1. Make sure ABI's reflect the same copy as the ones deployed on the Georli Network
2. Determine the blocknumber in which new contracts were deployed (fork must be _after_ this blocknumber)
3. Forking Georli -> type the following into terminal to launch anvil fork of Georli: `anvil --fork-url <INSERT RPC URL> --fork-block-number <INSERT BLOCK NUMBER>`
4. After running the fork use `ctrl + z` to pause and then type `bg` to run the fork in the background
5. Run unit test by running `yarn test` through the command line

### Contract Deployments

- 2023-11-06 (Arbitrum Goerli): ~53444156
- 2023-08-10 (Arbitrum Goerli): ~33821949
- 2023-08-02 (Arbitrum Goerli): ~32704676
- 2023-06-09 (Arbitrum Goerli): ~25083922
