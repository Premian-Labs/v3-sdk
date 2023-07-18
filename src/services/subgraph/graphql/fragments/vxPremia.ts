import { gql } from '@apollo/client/core'

import { TokenPairFragment } from './tokenPair'
import { VaultFragment } from './vault'
import { UserFragment } from './user'

export const VaultVoteFragment = gql`
	${VaultFragment}

	fragment VaultVote on VaultVote {
		id
		voter
		vaultName
		vault {
			...Vault
		}
		amount
		timestamp
		isLast
		version
	}
`

export const PairVoteFragment = gql`
	${TokenPairFragment}

	fragment PairVote on PairVote {
		id
		voter
		pairName
		pair {
			...TokenPair
		}
		amount
		timestamp
		isLast
		version
	}
`

export const VoteHistoryFragment = gql`
	fragment VoteHistory on VoteHistory {
		id
		totalVotes
		totalUsers
		timestamp
	}
`

export const UserStakeFragment = gql`
	${UserFragment}

	fragment UserStake on UserStake {
		id
		amount
		lockedAmount
		lockPeriod
		lockedUntil
		timestamp
		user {
			...User
		}
		votingPower
		voteAmount
	}
`

export const StakeHistoryFragment = gql`
	fragment StakeHistory on StakeHistory {
		id
		totalAmount
		totalLockedAmount
		totalLockPeriod
		timestamp
		totalUsers
		totalPower
	}
`
