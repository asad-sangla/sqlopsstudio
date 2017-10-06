/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as adal from 'adal-node';
import * as data from 'data';

export default class CredentialServiceTokenCache implements adal.TokenCache {
	private static MaxCredentialSize: number = 512;
	private static NullCredentialReadResult: CredentialReadResult = {
		index: null,
		cache: []
	};

	private _activeOperation: Thenable<any>;
	private _credentialProvider: data.CredentialProvider;
	private _credentialServiceKey: string;

	constructor(credentialProvider: data.CredentialProvider, credentialServiceKey: string) {
		this._credentialProvider = credentialProvider;
		this._credentialServiceKey = credentialServiceKey;
	}

	// PUBLIC METHODS //////////////////////////////////////////////////////
	public add(entries: adal.TokenCacheEntry[], callback: (error?: Error) => void): void {
		let self = this;

		this.doOperation(() => {
			return self.readCache()
				.then(cache => self.addToCache(cache, entries))
				.then(updatedCache => self.writeCache(updatedCache))
				.then(
					() => callback(null),
					(err) => callback(err)
				);
		});
	}

	public find(query: adal.TokenCacheQuery, callback: (error: Error, results: adal.TokenCacheEntry[]) => void): void {
		let self = this;

		this.doOperation(() => {
			return self.readCache()
				.then(cache => {
					return cache.cache.filter(
						entry => CredentialServiceTokenCache.findByPartial(entry, query)
					);
				})
				.then(
					results => callback(null, results),
					(err) => callback(err, null)
				);
		});
	}

	public remove(entries: adal.TokenCacheEntry[], callback: (error?: Error) => void): void {
		let self = this;

		this.doOperation(() => {
			return this.readCache()
				.then(cache => self.removeFromCache(cache, entries))
				.then(updatedCache => self.writeCache(updatedCache))
				.then(
					() => callback(null),
					(err) => callback(err)
				);
		});
	}

	// PRIVATE METHODS /////////////////////////////////////////////////////
	private static findByKeyHelper(entry1: adal.TokenCacheEntry, entry2: adal.TokenCacheEntry): boolean {
		return entry1._authority === entry2._authority
			&& entry1._clientId === entry2._clientId
			&& entry1.userId === entry2.userId
			&& entry1.resource === entry2.resource;
	}

	private static findByPartial(entry: adal.TokenCacheEntry, query: object): boolean {
		for (let key in query) {
			if (entry[key] === undefined || entry[key] !== query[key]) {
				return false;
			}
		}
		return true;
	}

	private doOperation<T>(op: () => Thenable<T>): void {
		// Initialize the active operation to an empty promise if necessary
		let activeOperation = this._activeOperation || Promise.resolve<any>(null);

		// Chain the operation to perform to the end of the existing promise
		activeOperation = activeOperation.then(op);

		// Add a catch at the end to make sure we can continue after any errors
		activeOperation = activeOperation.then(null, (err) => {
			// TODO: Log the error
		});

		// Point the current active operation to this one
		this._activeOperation = activeOperation;
	}

	private addToCache(cache: CredentialReadResult, entries: adal.TokenCacheEntry[]): CredentialReadResult {
		// First remove entries from the db that are being updated
		cache = this.removeFromCache(cache, entries);

		// Then add the new entries to the cache
		entries.forEach((entry: adal.TokenCacheEntry) => {
			cache.cache.push(entry);
		});

		return cache;
	}

	private getCredentialKey(index?: number): string {
		return index !== undefined && index !== null
			? `${this._credentialServiceKey}_${index}}`
			: `${this._credentialServiceKey}_index`;
	}

	private readCache(): Thenable<CredentialReadResult> {
		let self = this;

		// Read the index first
		let indexCredentialKey = this.getCredentialKey(null);
		return this._credentialProvider.readCredential(indexCredentialKey)
			.then((credential: data.Credential) => {

				let index: CredentialIndex;
				try {
					index = JSON.parse(credential.password);
				} catch(e) {
					// Disregard invalid JSON, we'll just assume the index doesn't exist
					index = null;
				}

				// If there isn't an index credential then we haven't stored any tokens yet
				if (!index) {
					return Promise.resolve(CredentialServiceTokenCache.NullCredentialReadResult);
				}

				// There was an index credential, read in all the chunks the index describes
				let lastReadPromise = Promise.resolve<string>('');
				for (let i = 0; i < index.totalChunks; i++) {
					let credKey = self.getCredentialKey(i);
					lastReadPromise = lastReadPromise
						.then((currentFragment) => {
							// Read the next chunk and concatenate it with the fragment
							return self._credentialProvider.readCredential(credKey)
								.then((credential) => {
									return currentFragment + credential.password;
								});
						});
				}

				// Deserialize the concatenated strings
				return lastReadPromise.then((serializedJson) => {
					let cache: any[];
					try {
						// Parse the data
						cache = JSON.parse(serializedJson);
					} catch(e) {
						cache = [];
					}

					// Disregard if unexpected data
					if(!Array.isArray(cache)) {
						cache = [];
					}

					// Fix up fields that require special formatting
					cache.forEach(entry => {
						entry.expiresOn = new Date(entry.expiresOn);
					});

					return <CredentialReadResult> {
						index: index,
						cache: cache
					};
				});
			})
			.then(null, err => {
				// If reading the token cache fails, we'll just assume the tokens are garbage
				console.error(`Failed to read token cache from credential service ${err}`);
				return CredentialServiceTokenCache.NullCredentialReadResult;
			});
	}

	private removeFromCache(cache: CredentialReadResult, entries: adal.TokenCacheEntry[]): CredentialReadResult {
		entries.forEach((entry: adal.TokenCacheEntry) => {
			// Check to see if the entry exists
			let match = cache.cache.findIndex(entry2 => CredentialServiceTokenCache.findByKeyHelper(entry, entry2));
			if (match >= 0) {
				// Entry exists, remove it from cache
				cache.cache.splice(match, 1);
			}
		});

		return cache;
	}

	private writeCache(cache: CredentialReadResult): Thenable<void> {
		let self = this;

		// Step 0) Create a base promise that all our operations will be attached to
		let promise = Promise.resolve(null);

		// Step 1) Delete existing entries in the credential store, if we have an index
		let deleteOperations: Thenable<boolean>[] = [];
		if (cache.index) {
			for (let i = 0; i < cache.index.totalChunks; i++) {
				let credKey = this.getCredentialKey(i);
				let deleteOperation = self._credentialProvider.deleteCredential(credKey);
				deleteOperations.push(deleteOperation);
			}
		}

		// Step 2) Serialize the cache
		let serializedTokens = JSON.stringify(cache.cache);

		// Step 3) Chunk the serialized cache and start writing each chunk
		// Due to limitation is in the credential stores (ie, max credential length) we need to chunk the cache
		let chunkCount = Math.ceil(serializedTokens.length / CredentialServiceTokenCache.MaxCredentialSize);
		let writeOperations: Thenable<boolean>[] = [];
		for (let i = 0; i < chunkCount; i++) {
			let startIndex = i * CredentialServiceTokenCache.MaxCredentialSize;
			let chunk = serializedTokens.substr(startIndex, CredentialServiceTokenCache.MaxCredentialSize);
			let credKey = this.getCredentialKey(i);

			let writeOperation = this._credentialProvider.saveCredential(credKey, chunk);
			writeOperations.push(writeOperation);
		}

		// Step 4) Write out an index 'credential' that tells us how many entries we wrote
		let indexCredential: CredentialIndex = {
			totalChunks: chunkCount,
			chunkSize: CredentialServiceTokenCache.MaxCredentialSize
		};
		let serializedIndexCredential = JSON.stringify(indexCredential);
		let indexCredentialKey = this.getCredentialKey(null);
		let indexWriteOperation = this._credentialProvider.saveCredential(indexCredentialKey, serializedIndexCredential);
		writeOperations.push(indexWriteOperation);

		return promise
			.then(() => Promise.all(deleteOperations))
			.then(() => Promise.all(writeOperations))
			.then(() => { return null; });
	}
}

interface CredentialIndex {
	chunkSize: number;
	totalChunks: number;
}

interface CredentialReadResult {
	index: CredentialIndex;
	cache: adal.TokenCacheEntry[];
}
