import { DocumentNode, gql } from '@apollo/client/core'
import { VaultExtendedFragment, VaultFragment } from '../fragments'
import { addFields } from '../../../../utils/subgraph'
import { TokenQuery } from './token'
import { Token } from '../../../../entities/token'
import PremiaSubgraph from '../../index'
import { TokenOrAddress } from '../../../../api'

export class VaultQuery {
	static vaultId(address: string): string {
		return address.toLowerCase()
	}

	@addFields
	static GetVault(subgraph: PremiaSubgraph, address: string): DocumentNode {
		return gql`
        ${VaultFragment}
        
        {
            vault(id: "${this.vaultId(address)}",
			subgraphError: allow) {
                ...Vault
            }
        }
    `
	}

	@addFields
	static GetVaultExtended(
		subgraph: PremiaSubgraph,
		address: string
	): DocumentNode {
		return gql`
        ${VaultExtendedFragment}

        {
            vault(id: "${this.vaultId(address)}",
			subgraphError: allow) {
                ...VaultExtended
            }
        }
    `
	}

	@addFields
	static GetAllVaultsExtended(subgraph: PremiaSubgraph): DocumentNode {
		return gql`
			${VaultExtendedFragment}

			{
				vaults(subgraphError: allow) {
					...VaultExtended
				}
			}
		`
	}

	@addFields
	static GetVaults(
		subgraph: PremiaSubgraph,
		tokenAddress: string
	): DocumentNode {
		return gql`
			${VaultFragment}

			{
				vaults(where: { asset: "${tokenAddress.toLowerCase()}" },
				subgraphError: allow) {
					...Vault
				}
			}
		`
	}

	@addFields
	static GetVaultsExtended(
		subgraph: PremiaSubgraph,
		tokenAddress: string
	): DocumentNode {
		return gql`
        ${VaultExtendedFragment}

        {
            vaults(where: { asset: "${tokenAddress.toLowerCase()}" },
			subgraphError: allow) {
                ...VaultExtended
            }
        }
    `
	}

	@addFields
	static GetVaultsForToken(
		subgraph: PremiaSubgraph,
		_token: TokenOrAddress
	): DocumentNode {
		const token = subgraph._parseTokenAddress(_token)
		return gql`
        ${VaultFragment}
        
        {
            vaults(where: { asset: "${TokenQuery.tokenId(token)}"}) {
                ...Vault
            }
        }
    `
	}

	@addFields
	static GetVaultsExtendedForToken(
		subgraph: PremiaSubgraph,
		_token: TokenOrAddress
	): DocumentNode {
		const token = subgraph._parseTokenAddress(_token)
		return gql`
        ${VaultExtendedFragment}

        {
            vaults(where: { asset: "${TokenQuery.tokenId(token)}" }) {
                ...VaultExtended
            }
        }
    `
	}
}
