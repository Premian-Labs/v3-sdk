// import { ChainId } from '@sushiswap/sdk'
// import qs from 'qs'

// import { Token, isToken } from 'constants/web3/tokens'
// import { CurrencyWithLogoUri } from 'hooks'
// import floatToBigNumber from 'utils/formatting/floatToBigNumber'

// export interface SwapQuoteParaswap {
//   from: string
//   to: string
//   value: string
//   data: string
//   gasPrice: string
//   gas: string
//   chainId: string
//   priceRoute: any
// }

// export async function getSwapDataParaswap(
//   buyToken: Token | CurrencyWithLogoUri | undefined = undefined,
//   sellToken: Token | CurrencyWithLogoUri | undefined = undefined,
//   buyAmount: string | undefined,
//   sellAmount: string | undefined,
//   account: string,
//   chainId: number,
//   exchangeHelperAddress: string,
//   slippagePercentage: number,
//   switchedInputType: boolean = false,
//   excludedSources: string,
//   includedSources?: string
// ): Promise<SwapQuoteParaswap> {
//   const supportedEip1559Chains = [ChainId.MAINNET, ChainId.ROPSTEN, ChainId.AVALANCHE]

//   if (!buyAmount && !sellAmount) {
//     throw Error('Invalid swap quote, must set either `buyAmount` or `sellAmount`.')
//   }

//   const priceRoute = await getSwapQuoteParaswap(
//     buyToken,
//     sellToken,
//     switchedInputType
//       ? floatToBigNumber(Number(buyAmount) * Number(slippagePercentage / 100 + 1), buyToken?.decimals ?? 18)
//       : floatToBigNumber(Number(sellAmount) * Number(slippagePercentage / 100 + 1), sellToken?.decimals ?? 18),
//     account,
//     switchedInputType,
//     chainId,
//     exchangeHelperAddress,
//     excludedSources,
//     includedSources
//   )

//   const params = {
//     srcToken: isToken(sellToken) ? sellToken.address : priceRoute?.srcToken,
//     srcDecimals: isToken(sellToken) ? sellToken.decimals : 18,
//     destToken: isToken(buyToken) ? buyToken.address : priceRoute?.destToken,
//     destDecimals: isToken(buyToken) ? buyToken.decimals : 18,
//     ...(switchedInputType
//       ? {
//           destAmount: floatToBigNumber(
//             Number(buyAmount) * Number(slippagePercentage / 100 + 1),
//             buyToken?.decimals ?? 18
//           ),
//         }
//       : {
//           srcAmount: floatToBigNumber(
//             Number(sellAmount) * Number(slippagePercentage / 100 + 1),
//             sellToken?.decimals ?? 18
//           ),
//         }),
//     side: switchedInputType ? 'BUY' : 'SELL',
//     slippage: '0',
//     priceRoute,
//     userAddress: account,
//     partner: 'premia.finance',
//   }

//   const queryParams = {
//     eip1559: supportedEip1559Chains.includes(chainId),
//     ignoreChecks: true,
//   }

//   const queryString = qs.stringify(queryParams, {
//     arrayFormat: 'comma',
//     encode: false,
//   })

//   const responsePrepare = await fetch(`https://apiv5.paraswap.io/transactions/${chainId}?${queryString}`, {
//     method: 'POST',
//     body: JSON.stringify(params),
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     cache: 'no-cache',
//   })

//   const preparedQuote = await responsePrepare.json()

//   preparedQuote.priceRoute = priceRoute

//   return preparedQuote
// }

// export async function getSwapQuoteParaswap(
//   buyToken: Token | CurrencyWithLogoUri | undefined,
//   sellToken: Token | CurrencyWithLogoUri | undefined,
//   sellAmount: string,
//   account: string,
//   switchedInputType: boolean | undefined,
//   chainId: number,
//   exchangeHelperAddress: string,
//   excludedSources: string,
//   includedSources?: string
// ) {
//   const params = {
//     srcToken: isToken(sellToken) ? sellToken.address : sellToken?.symbol,
//     srcDecimals: isToken(sellToken) ? sellToken.decimals : 18,
//     destToken: isToken(buyToken) ? buyToken.address : buyToken?.symbol,
//     destDecimals: isToken(buyToken) ? buyToken.decimals : 18,
//     amount: sellAmount,
//     side: switchedInputType ? 'BUY' : 'SELL',
//     network: chainId,
//     excludedDEXS: excludedSources,
//     ...(includedSources ? { includedDEXS: includedSources } : {}),
//     userAddress: account,
//     partner: 'premia.finance',
//   }

//   const queryString = qs.stringify(params, {
//     arrayFormat: 'comma',
//     encode: false,
//   })

//   const response = await fetch(`https://apiv5.paraswap.io/prices?${queryString}`)
//   const json = await response.json()

//   return json.priceRoute
// }
