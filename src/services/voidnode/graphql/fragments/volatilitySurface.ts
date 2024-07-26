import { gql } from '@apollo/client/core'

import { TokenFragment } from './token'

export const VolatilitySurfaceFragment = gql`
	${TokenFragment}

	fragment VolatilitySurface on VolatilitySurface {
		_id
		quote {
			...Token
		}
		base {
			...Token
		}
		pair {
			_id
			priceOracleAddress
		}

		updatedAt

		pools {
			_id
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
