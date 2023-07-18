// import qs from 'qs';

// import { Token, isToken } from 'constants/web3/tokens';
// import { CurrencyWithLogoUri } from 'hooks';
// import floatToBigNumber from 'utils/formatting/floatToBigNumber';
// import { ETH_SWAP_ADDRESS } from 'constants/living/tokens';

// export interface TransactionBuild1inch {
//   data: any;
//   to: string;
//   gas: string;
//   gasPrice: string;
//   value: string;
// }

// export interface SwapQuote1inch {
//   fromToken: Token;
//   toToken: Token;
//   fromTokenAmount: number;
//   toTokenAmount: number;
//   protocols: string[];
//   tx: TransactionBuild1inch;
// }

// export async function getSwapQuote1inch(
//   buyToken: Token | CurrencyWithLogoUri | undefined,
//   sellToken: Token | CurrencyWithLogoUri | undefined,
//   sellAmount: string | undefined,
//   chainId: number,
//   slippagePercentage: number,
//   account: string,
// ): Promise<SwapQuote1inch> {
//   const quoteParams = {
//     fromTokenAddress: isToken(sellToken) ? sellToken.address : ETH_SWAP_ADDRESS,
//     toTokenAddress: isToken(buyToken) ? buyToken.address : ETH_SWAP_ADDRESS,
//     amount: floatToBigNumber(Number(sellAmount), sellToken?.decimals ?? 18),
//   };

//   const params = {
//     ...quoteParams,
//     fromAddress: account,
//     slippage: slippagePercentage / 100,
//     disableEstimate: true,
//   };

//   const quoteQueryString = qs.stringify(quoteParams, {
//     arrayFormat: 'comma',
//     encode: false,
//   });

//   const queryString = qs.stringify(params, {
//     arrayFormat: 'comma',
//     encode: false,
//   });

//   const [quoteResponse, swapResponse] = await Promise.all([
//     fetch(`https://api.1inch.io/v4.0/${chainId}/quote?${quoteQueryString}`),
//     fetch(`https://api.1inch.io/v4.0/${chainId}/swap?${queryString}`),
//   ]);
//   const [quoteJson, json] = await Promise.all([
//     quoteResponse.json(),
//     swapResponse.json(),
//   ]);

//   if (json && json.tx && quoteJson && quoteJson.estimatedGas) {
//     json.tx.gas = quoteJson.estimatedGas;
//   }

//   return json;
// }
