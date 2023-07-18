import {
	BaseContract,
	ContractTransaction,
	ContractTransactionResponse,
} from 'ethers'

export declare type PromiseOrValue<T> = Promise<T> | T

export type Web3Window = Window &
	typeof globalThis & {
		ethereum: any
	}

export async function sendTransaction(
	contract: BaseContract,
	tx: PromiseOrValue<ContractTransaction>,
	encodeFnName: string
): Promise<ContractTransactionResponse> {
	if (!contract.runner || !contract.runner.sendTransaction) {
		throw new Error(
			'Cannot send a transaction without a signer. Use `' +
				encodeFnName +
				'` instead, or set the `signer` in the SDK.'
		)
	}
	return contract.runner.sendTransaction?.(
		await tx
	) as unknown as ContractTransactionResponse
}
