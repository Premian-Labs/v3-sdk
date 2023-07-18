// import { ChainId } from '@sushiswap/sdk';
// import qs from 'qs';

// import { Token, isToken } from 'constants/web3/tokens';
// import { CurrencyWithLogoUri } from 'hooks';
// import { ExtraChainId } from 'constants/living/chains';
// import floatToBigNumber from 'utils/formatting/floatToBigNumber';

// export interface SwapQuote0x {
//   price: string;
//   guaranteedPrice: string;
//   to: string;
//   data: string;
//   value: string;
//   gas: string;
//   estimatedGas: string;
//   gasPrice: string;
//   minimumProtocolFee: string;
//   buyTokenAddress: string;
//   sellTokenAddress: string;
//   buyAmount: string;
//   sellAmount: string;
//   allowanceTarget: string;
//   orders: any[];
// }

// export interface SwapSources0x {
//  records: string[];
// }

// export async function getSwapQuote0x(
//   buyToken: Token | CurrencyWithLogoUri | undefined,
//   sellToken: Token | CurrencyWithLogoUri | undefined,
//   buyAmount: string | undefined,
//   sellAmount: string | undefined,
//   chainId: number,
//   slippagePercentage: number,
//   switchedInputType: boolean,
//   exchangeHelperAddress: string,
//   excludedSources: string,
//   includedSources?: string,
// ): Promise<SwapQuote0x> {
//   const params: any = {
//     buyToken: isToken(buyToken) ? buyToken.address : buyToken?.symbol,
//     sellToken: isToken(sellToken) ? sellToken.address : sellToken?.symbol,
//     slippagePercentage,
//     takerAddress: exchangeHelperAddress,
//     skipValidation: true,
//   };

//   if (switchedInputType && buyAmount) {
//     params.buyAmount = floatToBigNumber(
//       Number(buyAmount),
//       buyToken?.decimals ?? 18,
//     );
//   } else if (!switchedInputType && sellAmount) {
//     params.sellAmount = floatToBigNumber(
//       Number(sellAmount),
//       sellToken?.decimals ?? 18,
//     );
//   } else {
//     throw Error(
//       'Invalid swap quote, must set either `buyAmount` or `sellAmount`.',
//     );
//   }

//   if (excludedSources) {
//     params.excludedSources = excludedSources;
//   }
//   if (includedSources) {
//     params.includedSources = includedSources;
//   }

//   let prefix = '';

//   switch (chainId) {
//     case ChainId.BSC:
//       prefix = 'bsc.';
//       break;

//     case ChainId.GÖRLI:
//       prefix = 'goerli.';
//       break;

//     case ChainId.ROPSTEN:
//       prefix = 'ropsten';
//       break;

//     case ChainId.MATIC:
//       prefix = 'polygon.';
//       break;

//     case ChainId.FANTOM:
//       prefix = 'fantom.';
//       break;

//     case ChainId.AVALANCHE:
//       prefix = 'avalanche.';
//       break;

//     case ExtraChainId.OPTIMISM:
//       prefix = 'optimism.';
//       break;

//     case ChainId.ARBITRUM:
//       prefix = 'arbitrum.';
//       break;

//     default:
//       break;
//   }

//   const queryString = qs.stringify(params, {
//     arrayFormat: 'comma',
//     encode: false,
//   });

//   const response = await fetch(
//     `https://${prefix}api.0x.org/swap/v1/quote?${queryString}`,
//   );
//   const quote = await response.json();

//   return quote;
// }

// export async function getSwapSources0x(
//   chainId: number,
// ): Promise<SwapSources0x> {

//   let prefix = '';

//   switch (chainId) {
//     case ChainId.BSC:
//       prefix = 'bsc.';
//       break;

//     case ChainId.GÖRLI:
//       prefix = 'goerli.';
//       break;

//     case ChainId.ROPSTEN:
//       prefix = 'ropsten';
//       break;

//     case ChainId.MATIC:
//       prefix = 'polygon.';
//       break;

//     case ChainId.FANTOM:
//       prefix = 'fantom.';
//       break;

//     case ChainId.AVALANCHE:
//       prefix = 'avalanche.';
//       break;

//     case ExtraChainId.OPTIMISM:
//       prefix = 'optimism.';
//       break;

//     case ChainId.ARBITRUM:
//       prefix = 'arbitrum.';
//       break;

//     default:
//       break;
//   }

//   const response = await fetch(
//     `https://${prefix}api.0x.org/swap/v1/sources`,
//   );
//   const sources = await response.json();

//   return sources;
// }
