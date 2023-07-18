import { PairList } from '@premia/pair-lists/src/types'

import defaultArbitrumPairList from './default.arbitrum.pairlist.json'
import defaultArbitrumGoerliPairList from './default.arbitrumGoerli.pairlist.json'
import defaultGoerliPairList from './default.goerli.pairlist.json'
import { SupportedChainId } from '../constants'
import { resolveReferences } from '../utils'

export const defaultPairs: { [key in SupportedChainId]?: PairList } = {
	[SupportedChainId.ARBITRUM]: resolveReferences(
		defaultArbitrumPairList
	) as unknown as PairList,
	[SupportedChainId.ARBITRUM_GOERLI]: resolveReferences(
		defaultArbitrumGoerliPairList
	) as unknown as PairList,
	[SupportedChainId.GOERLI]: resolveReferences(
		defaultGoerliPairList
	) as unknown as PairList,
}

export default defaultPairs
