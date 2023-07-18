import { DocumentNode, gql } from '@apollo/client/core'
import {
	VaultPositionExtendedFragment,
	VaultPositionFragment,
} from '../fragments'
import { addFields } from '../../../../utils/subgraph'
import PremiaSubgraph from '../../index'

export class VaultPositionQuery {
	static vaultPositionId(owner: string, vaultAddress: string): string {
		return owner.toLowerCase() + ':' + vaultAddress.toLowerCase()
	}

	@addFields
	static GetVaultPositionsExtendedForUser(
		subgraph: PremiaSubgraph,
		owner: string
	): DocumentNode {
		return gql`
        ${VaultPositionExtendedFragment}

        {
            vaultPositions(where: {
            	owner: "${owner.toLowerCase()}"
            }) {
                ...VaultPositionExtended
            }
        }
    `
	}

	@addFields
	static GetVaultPosition(
		subgraph: PremiaSubgraph,
		owner: string,
		vaultAddress: string
	): DocumentNode {
		return gql`
			${VaultPositionFragment}

			{
				vaultPosition(
					id: "${this.vaultPositionId(owner, vaultAddress)}"
				) {
					...VaultPosition
				}
			}
		`
	}

	@addFields
	static GetVaultPositionExtended(
		subgraph: PremiaSubgraph,
		owner: string,
		vaultAddress: string
	): DocumentNode {
		return gql`
			${VaultPositionExtendedFragment}
			
			{
				vaultPosition(id: "${this.vaultPositionId(owner, vaultAddress)}") {
					...VaultPositionExtended
				}
			}
		`
	}
}
