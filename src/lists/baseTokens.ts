import { TokenInfo } from '@premia/pair-lists/src/types'
import { TokenList } from '@uniswap/token-lists'

import baseArbitrumTokensJson from './base.arbitrum.tokenlist.json'
import baseArbitrumGoerliTokensJson from './base.arbitrumGoerli.tokenlist.json'
import baseGoerliTokensJson from './base.goerli.tokenlist.json'
import { SupportedChainId } from '../constants'

export const baseTokens: { [key in SupportedChainId]?: TokenInfo[] } = {
	[SupportedChainId.ARBITRUM]: baseArbitrumTokensJson.tokens,
	[SupportedChainId.ARBITRUM_GOERLI]: baseArbitrumGoerliTokensJson.tokens,
	[SupportedChainId.GOERLI]: baseGoerliTokensJson.tokens,
}

export const baseTokenList: { [key in SupportedChainId]?: TokenList } = {
	[SupportedChainId.ARBITRUM]: baseArbitrumTokensJson,
	[SupportedChainId.ARBITRUM_GOERLI]: baseArbitrumGoerliTokensJson,
	[SupportedChainId.GOERLI]: baseGoerliTokensJson,
}

export default baseTokens
