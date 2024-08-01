import { gql } from '@apollo/client/core'

export const TickFragment = gql`
	fragment Tick on Tick {
		id
		createdAt
		createdAtBlock
		index
		price
		normalizedPrice

		delta
		externalFeeRate
		shortDelta
		longDelta
		counter

		prev {
			id
			index
			price
			normalizedPrice
		}

		next {
			id
			index
			price
			normalizedPrice
		}
	}
`
