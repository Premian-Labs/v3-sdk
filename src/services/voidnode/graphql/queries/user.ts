import { DocumentNode, gql } from '@apollo/client/core'
import { BigNumberish, getAddress } from 'ethers'

import {
	UserExtendedFragment,
	UserFragment,
	UserPortfolioExtendedFragment,
	UserPortfolioFragment,
	UserSnapshotExtendedFragment,
	UserSnapshotFragment,
	TradingCompetitionUserFragment,
} from '../fragments'
import { addFields } from '../../../../utils/voidnode'
import PremiaVoidnode from '../../index'

export class UserQuery {
	static userId(address: string): string {
		return getAddress(address)
	}

	static snapshotId(address: string, timestamp: BigNumberish): string {
		return getAddress(address) + ':' + timestamp.toString()
	}

	@addFields
	static GetTradingCompetitionUser(
		voidnode: PremiaVoidnode,
		address: string
	): DocumentNode {
		return gql`
        ${TradingCompetitionUserFragment}

        {
            tradingCompetitionUser(id: "${this.userId(address)}") {
                ...TradingCompetitionUser
            }
        }
    `
	}

	@addFields
	static GetUser(voidnode: PremiaVoidnode, address: string): DocumentNode {
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
		voidnode: PremiaVoidnode,
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
		voidnode: PremiaVoidnode,
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
		voidnode: PremiaVoidnode,
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
		voidnode: PremiaVoidnode,
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
		voidnode: PremiaVoidnode,
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
	static GetUsers(voidnode: PremiaVoidnode, addresses: string[]): DocumentNode {
		return gql`
        ${UserFragment}

        {
            users(where: {
                _id_in: [${addresses
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
		voidnode: PremiaVoidnode,
		addresses: string[]
	): DocumentNode {
		return gql`
        ${UserExtendedFragment}

        {
            users(where: {
                _id_in: [${addresses
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
		voidnode: PremiaVoidnode,
		address: string,
		startTime: BigNumberish,
		endTime: BigNumberish,
		orderBy: string = 'timestamp',
		order: string = 'ASC',
		limit = 100,
		skip = 0
	): DocumentNode {
		return gql`
        ${UserSnapshotFragment}

        {  
			userSnapshots(
				limit: ${limit}
				skip: ${skip}
				orderBy: [{
					field: ${orderBy},
					direction: ${order.toUpperCase()}
				}]
				where: {
					user: "${getAddress(address)}",
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
		order: string = 'ASC',
		limit = 100,
		skip = 0
	): DocumentNode {
		return gql`
        ${UserSnapshotExtendedFragment}

        {
			userSnapshots(
				limit: ${limit}
				skip: ${skip}
				orderBy: [{
					field: ${orderBy},
					direction: ${order.toUpperCase()}
				}]
				where: {
					user: "${getAddress(address)}",
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
