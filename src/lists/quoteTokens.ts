import { TokenInfo } from '@premia/pair-lists/src/types'
import { TokenList } from '@uniswap/token-lists'

import quoteTokensArbitrumJson from './quote.arbitrum.tokenlist.json'
import quoteTokensArbitrumGoerliJson from './quote.arbitrumGoerli.tokenlist.json'
import quoteTokensGoerliJson from './quote.goerli.tokenlist.json'
import { SupportedChainId } from '../constants'

export const quoteTokens: { [key in SupportedChainId]?: TokenInfo[] } = {
	[SupportedChainId.ARBITRUM]: quoteTokensArbitrumJson.tokens,
	[SupportedChainId.ARBITRUM_GOERLI]: quoteTokensArbitrumGoerliJson.tokens,
	[SupportedChainId.GOERLI]: quoteTokensGoerliJson.tokens,
}

export const quoteTokenList: { [key in SupportedChainId]?: TokenList } = {
	[SupportedChainId.ARBITRUM]: quoteTokensArbitrumJson,
	[SupportedChainId.ARBITRUM_GOERLI]: quoteTokensArbitrumGoerliJson,
	[SupportedChainId.GOERLI]: quoteTokensGoerliJson,
}

export default quoteTokens
