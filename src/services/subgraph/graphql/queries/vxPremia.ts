import { DocumentNode, gql } from '@apollo/client/core'
import { addFields } from '../../../../utils/subgraph'
import {
	StakeHistoryFragment,
	UserStakeFragment,
	VaultVoteFragment,
	VoteHistoryFragment,
} from '../fragments'
import PremiaSubgraph from '../../index'

export class VxPremiaQuery {
	@addFields
	static GetVaultVotes(
		subgraph: PremiaSubgraph,
		user: string,
		first = 100,
		skip = 0
	): DocumentNode {
		return gql`
      ${VaultVoteFragment}

      query VaultVote {
        vaultVotes(first: ${first}, skip: ${skip}, where: { voter: "${user.toLowerCase()}", isLast: true }) {
          ...VaultVote
        }
      }
    `
	}

	@addFields
	static GetUserVaultVotesFromTimestamp(
		subgraph: PremiaSubgraph,
		user: string,
		timestampFrom: number,
		timestampTo: number,
		first = 100,
		skip = 0
	): DocumentNode {
		return gql`
      ${VaultVoteFragment}

      query VaultVote {
        vaultVotes(
          first: ${first}
          skip: ${skip}
          where: { voter: "${user.toLowerCase()}", timestamp_lte: ${timestampTo}, timestamp_gte: ${timestampFrom} }
          orderBy: timestamp
          orderDirection: desc
        ) {
          ...VaultVote
        }
      }
    `
	}

	@addFields
	static GetAllLastVaultVotes(
		subgraph: PremiaSubgraph,
		orderBy: string,
		order: string,
		first = 100,
		skip = 0
	): DocumentNode {
		return gql`
      ${VaultVoteFragment}

      query VaultVote {
        vaultVotes(
          first: ${first}
          skip: ${skip}
          orderBy: ${orderBy}
          orderDirection: ${order}
          where: { isLast: true, size_gt: 0 }
        ) {
          ...VaultVote
        }
      }
    `
	}

	@addFields
	static GetVoteHistoryFromId(
		subgraph: PremiaSubgraph,
		id: string
	): DocumentNode {
		return gql`
      ${VoteHistoryFragment}

      query VoteHistory {
        voteHistory(id: ${id}) {
          ...VoteHistory
        }
      }
    `
	}

	@addFields
	static GetLastUserStakes(subgraph: PremiaSubgraph): DocumentNode {
		return gql`
			${UserStakeFragment}

			query UserStake {
				userStakes(
					first: 14
					orderBy: "amount"
					orderDirection: "desc"
					where: { isLast: true }
				) {
					...UserStake
				}
			}
		`
	}

	@addFields
	static GetUserStakes(
		subgraph: PremiaSubgraph,
		startTime: number,
		user: string,
		first = 100,
		skip = 0
	): DocumentNode {
		return gql`
      ${UserStakeFragment}

      query UserStake {
        userStakes(
          first: ${first}
          skip: ${skip}
          orderBy: timestamp
          orderDirection: asc
          where: { timestamp_gte: ${startTime}, user: "${user.toLowerCase()}" }
        ) {
          ...UserStake
        }
      }
    `
	}

	@addFields
	static GetLastUserStakeFromTimestamp(
		subgraph: PremiaSubgraph,
		timestamp: number,
		user: string
	): DocumentNode {
		return gql`
      ${UserStakeFragment}

      query UserStake {
        userStakes(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { timestamp_lte: ${timestamp}, user: "${user.toLowerCase()}" }
        ) {
          ...UserStake
        }
      }
    `
	}

	@addFields
	static GetStakeHistoryFromId(
		subgraph: PremiaSubgraph,
		id: string
	): DocumentNode {
		return gql`
      ${StakeHistoryFragment}

      query StakeHistory {
        stakeHistory(id: "${id}") {
          ...StakeHistory
        }
      }
    `
	}

	@addFields
	static GetStakeHistories(
		subgraph: PremiaSubgraph,
		startTime: number,
		first = 100,
		skip = 0
	): DocumentNode {
		return gql`
      ${StakeHistoryFragment}

      query StakeHistory {
        stakeHistories(
          first: ${first}
          skip: ${skip}
          where: { timestamp_gte: ${startTime} }
          orderBy: timestamp
          orderDirection: asc
        ) {
          ...StakeHistory
        }
      }
    `
	}
}
