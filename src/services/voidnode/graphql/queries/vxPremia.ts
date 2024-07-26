import { DocumentNode, gql } from '@apollo/client/core'
import { getAddress } from 'ethers'

import { addFields } from '../../../../utils/voidnode'
import {
	StakeHistoryFragment,
	UserStakeFragment,
	VaultVoteFragment,
	VoteHistoryFragment,
} from '../fragments'
import PremiaVoidnode from '../../index'

export class VxPremiaQuery {
	@addFields
	static GetVaultVotes(
		voidnode: PremiaVoidnode,
		user: string,
		limit = 100,
		skip = 0
	): DocumentNode {
		return gql`
      ${VaultVoteFragment}

      query VaultVote {
        vaultVotes(limit: ${limit}, skip: ${skip}, where: { voter: "${getAddress(
			user
		)}", isLast: true }) {
          ...VaultVote
        }
      }
    `
	}

	@addFields
	static GetUserVaultVotesFromTimestamp(
		voidnode: PremiaVoidnode,
		user: string,
		timestampFrom: number,
		timestampTo: number,
		limit = 100,
		skip = 0
	): DocumentNode {
		return gql`
      ${VaultVoteFragment}

      query VaultVote {
        vaultVotes(
          limit: ${limit}
          skip: ${skip}
          where: { voter: "${getAddress(
						user
					)}", timestamp_lte: ${timestampTo}, timestamp_gte: ${timestampFrom} }
          orderBy: [{
			field: timestamp
          	direction: DESC
		  }]
        ) {
          ...VaultVote
        }
      }
    `
	}

	@addFields
	static GetAllLastVaultVotes(
		voidnode: PremiaVoidnode,
		orderBy: string,
		order: string,
		limit = 100,
		skip = 0
	): DocumentNode {
		return gql`
      ${VaultVoteFragment}

      query VaultVote {
        vaultVotes(
          limit: ${limit}
          skip: ${skip}
          orderBy: [{
			field: ${orderBy},
          	direction: ${order.toUpperCase()}
		  }]
          where: { isLast: true, amount_gt: 0 }
        ) {
          ...VaultVote
        }
      }
    `
	}

	@addFields
	static GetVoteHistoryFromId(
		voidnode: PremiaVoidnode,
		id: string
	): DocumentNode {
		return gql`
      ${VoteHistoryFragment}

      query VoteHistory {
        voteHistory(id: "${id}") {
          ...VoteHistory
        }
      }
    `
	}

	@addFields
	static GetLastUserStakes(voidnode: PremiaVoidnode): DocumentNode {
		return gql`
			${UserStakeFragment}

			query UserStake {
				userStakes(
					limit: 14
					orderBy: [{ field: amount, direction: DESC }]
					where: { isLast: true }
				) {
					...UserStake
				}
			}
		`
	}

	@addFields
	static GetUserStakes(
		voidnode: PremiaVoidnode,
		startTime: number,
		user: string,
		limit = 100,
		skip = 0
	): DocumentNode {
		return gql`
      ${UserStakeFragment}

      query UserStake {
        userStakes(
          limit: ${limit}
          skip: ${skip}
          orderBy: [{
			field: timestamp,
			direction: ASC
		  }]
          where: { timestamp_gte: ${startTime}, user: "${getAddress(user)}" }
        ) {
          ...UserStake
        }
      }
    `
	}

	@addFields
	static GetLastUserStakeFromTimestamp(
		voidnode: PremiaVoidnode,
		timestamp: number,
		user: string
	): DocumentNode {
		return gql`
      ${UserStakeFragment}

      query UserStake {
        userStakes(
          limit: 1
          orderBy: [{
			field: timestamp,
          	direction: DESC
		  }]
          where: { timestamp_lte: ${timestamp}, user: "${getAddress(user)}" }
        ) {
          ...UserStake
        }
      }
    `
	}

	@addFields
	static GetStakeHistoryFromId(
		voidnode: PremiaVoidnode,
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
		voidnode: PremiaVoidnode,
		startTime: number,
		limit = 100,
		skip = 0
	): DocumentNode {
		return gql`
      ${StakeHistoryFragment}

      query StakeHistory {
        stakeHistories(
          limit: ${limit}
          skip: ${skip}
          where: { timestamp_gte: ${startTime} }
          orderBy: [{
			field: timestamp,
			direction: ASC
		  }]
        ) {
          ...StakeHistory
        }
      }
    `
	}
}
