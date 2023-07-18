import { gql } from '@apollo/client/core'

import { TokenFragment } from './token'

export const VolatilitySurfaceFragment = gql`
	${TokenFragment}

	fragment VolatilitySurface on VolatilitySurface {
		id
		quote {
			...Token
		}
		base {
			...Token
		}
		pair {
			id
			priceOracleAddress
		}

		updatedAt

		pools {
			id
			address
			strike
			maturity
			marketPrice
			impliedVolatility
			totalValueLocked
			totalValueLockedETH
			totalValueLockedUSD
		}
	}
`
