import { gql } from '@apollo/client/core'

import { TokenFragment } from './token'

export const OptionPhysicallySettledFragment = gql`
	${TokenFragment}

	fragment OptionPhysicallySettled on OptionPhysicallySettled {
		id
		address
		name
		base {
			...Token
		}
		quote {
			...Token
		}
		optionType
		isCall
		collateralAsset {
			...Token
		}
		strikeAsset {
			...Token
		}
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
