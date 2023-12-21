import { gql } from '@apollo/client/core'

import { OptionPhysicallySettledFragment } from './option'
import { TokenFragment } from './token'

export const OptionPSTransactionFragment = gql`
	${OptionPhysicallySettledFragment}
	${TokenFragment}

	fragment OptionPSTransaction on OptionPSTransaction {
		id
		option {
			...OptionPhysicallySettled
		}
		tokenSymbol
		token {
			...Token
		}
		origin
		gasUsed
		gasPrice
		timestamp
		block
		logIndex

		type
		action
		description
		size
		sizeETH
		sizeUSD
	}
`
