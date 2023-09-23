import { gql } from '@apollo/client/core'

import { TokenFragment } from './token'

export const OptionPhysicallySettledFragment = gql`
	${TokenFragment}

	fragment OptionPhysicallySettled on OptionPhysicallySettled {
		id
		base {
			...Token
		}
		quote {
			...Token
		}
		strike
		maturity
		optionType
		isCall
		owner {
			address
		}
		isBuy
		tokenType
		createdAt
		createdAtBlock
		closedAt
		closedAtBlock

		size
	}
`

export const OptionRewardFragment = gql`
	fragment OptionReward on OptionReward {
		id
		option {
			...OptionPhysicallySettled
		}
		oracleAdapter
		paymentSplitter
		discount
		penalty
		optionDuration
		lockupDuration
		claimDuration
		fee
		feeReceiver
	}
`
