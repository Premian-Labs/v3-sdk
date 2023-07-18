import { DocumentNode, gql } from '@apollo/client/core'

export class BlockQuery {
	get GetCurrentBlock(): DocumentNode {
		return gql`
			query GetBlock {
				_meta {
					block {
						number
					}
				}
			}
		`
	}
}
