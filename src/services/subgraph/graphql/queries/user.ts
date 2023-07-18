import { DocumentNode, gql } from '@apollo/client/core'
import {
	UserExtendedFragment,
	UserFragment,
	UserPortfolioExtendedFragment,
	UserPortfolioFragment,
	UserSnapshotExtendedFragment,
	UserSnapshotFragment,
} from '../fragments'
import { addFields } from '../../../../utils/subgraph'
import { BigNumberish } from 'ethers'
import PremiaSubgraph from '../../index'

export class UserQuery {
	static userId(address: string): string {
		return address.toLowerCase()
	}

	static snapshotId(address: string, timestamp: BigNumberish): string {
		return address.toLowerCase() + ':' + timestamp.toString()
	}

	@addFields
	static GetUser(subgraph: PremiaSubgraph, address: string): DocumentNode {
		return gql`
        ${UserFragment}

        {
            user(id: "${this.userId(address)}") {
                ...User
            }
        }
    `
	}

	@addFields
	static GetUserExtended(
		subgraph: PremiaSubgraph,
		address: string
	): DocumentNode {
		return gql`
        ${UserExtendedFragment}
        
        {
            user(id: "${this.userId(address)}") {
                ...UserExtended
            }
        }
    `
	}

	@addFields
	static GetUserSnapshot(
		subgraph: PremiaSubgraph,
		address: string,
		timestamp: BigNumberish
	): DocumentNode {
		return gql`
        ${UserSnapshotFragment}

        {
            userSnapshot(id: "${this.snapshotId(address, timestamp)}") {
                ...UserSnapshot
            }
        }
    `
	}

	@addFields
	static GetUserSnapshotExtended(
		subgraph: PremiaSubgraph,
		address: string,
		timestamp: BigNumberish
	): DocumentNode {
		return gql`
        ${UserSnapshotExtendedFragment}

        {   
            userSnapshot(id: "${this.snapshotId(address, timestamp)}") {
                ...UserSnapshotExtended
            }
        }
    `
	}

	@addFields
	static GetUserPortfolio(
		subgraph: PremiaSubgraph,
		address: string
	): DocumentNode {
		return gql`
        ${UserPortfolioFragment}

        { 
            user(id: "${this.userId(address)}") {
                ...UserPortfolio
            }
        }
    `
	}

	@addFields
	static GetUserPortfolioExtended(
		subgraph: PremiaSubgraph,
		address: string
	): DocumentNode {
		return gql`
        ${UserPortfolioExtendedFragment}

        {
            user(id: "${this.userId(address)}") {
                ...UserPortfolioExtended
            }
        }
    `
	}

	@addFields
	static GetUsers(subgraph: PremiaSubgraph, addresses: string[]): DocumentNode {
		return gql`
        ${UserFragment}

        {
            users(where: {
                id_in: [${addresses
									.map((a) => `"${this.userId(a)}"`)
									.join(', ')}],
            }) {
                ...User
            }
        }
    `
	}

	@addFields
	static GetUsersExtended(
		subgraph: PremiaSubgraph,
		addresses: string[]
	): DocumentNode {
		return gql`
        ${UserExtendedFragment}

        {
            users(where: {
                id_in: [${addresses
									.map((a) => `"${this.userId(a)}"`)
									.join(', ')}],
            }) {
                ...UserExtended
            }
        }
    `
	}

	@addFields
	static GetUserSnapshots(
		subgraph: PremiaSubgraph,
		address: string,
		startTime: BigNumberish,
		endTime: BigNumberish,
		orderBy: string = 'timestamp',
		order: string = 'asc',
		first = 100,
		skip = 0
	): DocumentNode {
		return gql`
        ${UserSnapshotFragment}

        {  
			userSnapshots(
				first: ${first}
				skip: ${skip}
				orderBy: "${orderBy}"
				orderDirection: "${order}"
				where: {
					user: "${address.toLowerCase()}",
					timestamp_gte: ${Number(startTime)},
					timestamp_lte: ${Number(endTime)},
				}
			) {
				...UserSnapshot
			}
        }
    `
	}

	@addFields
	static GetUserSnapshotsExtended(
		address: string,
		startTime: BigNumberish,
		endTime: BigNumberish,
		orderBy: string = 'timestamp',
		order: string = 'asc',
		first = 100,
		skip = 0
	): DocumentNode {
		return gql`
        ${UserSnapshotExtendedFragment}

        {
			userSnapshots(
				first: ${first}
				skip: ${skip}
				orderBy: "${orderBy}"
				orderDirection: "${order}"
				where: {
					user: "${address.toLowerCase()}",
					timestamp_gte: ${Number(startTime)},
					timestamp_lte: ${Number(endTime)},
				}
			) {
			...UserSnapshotExtended
            }
        }
    `
	}
}
