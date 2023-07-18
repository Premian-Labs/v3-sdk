import { DocumentNode, gql } from '@apollo/client/core'
import { VaultExtendedFragment, VaultFragment } from '../fragments'
import { addFields } from '../../../../utils/subgraph'
import { TokenQuery } from './token'
import { Token } from '../../../../entities/token'
import PremiaSubgraph from '../../index'

export class VaultQuery {
	static vaultId(address: string): string {
		return address.toLowerCase()
	}

	@addFields
	static GetVault(subgraph: PremiaSubgraph, address: string): DocumentNode {
		return gql`
        ${VaultFragment}
        
        {
            vault(id: "${this.vaultId(address)}") {
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
            vault(id: "${this.vaultId(address)}") {
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
				vaults {
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
				vaults(where: { asset: "${tokenAddress.toLowerCase()}" }) {
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
            vaults(where: { asset: "${tokenAddress.toLowerCase()}" }) {
                ...VaultExtended
            }
        }
    `
	}

	@addFields
	static GetVaultsForToken(
		subgraph: PremiaSubgraph,
		token: Token
	): DocumentNode {
		return gql`
        ${VaultFragment}
        
        {
            vaults(where: { asset: "${TokenQuery.tokenId(token.address)}"}) {
                ...Vault
            }
        }
    `
	}

	@addFields
	static GetVaultsExtendedForToken(
		subgraph: PremiaSubgraph,
		token: Token
	): DocumentNode {
		return gql`
        ${VaultExtendedFragment}

        {
            vaults(where: { asset: "${TokenQuery.tokenId(token.address)}" }) {
                ...VaultExtended
            }
        }
    `
	}
}
