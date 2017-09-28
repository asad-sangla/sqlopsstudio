/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'pretty-data' {
	export interface PrettyData {
		xml(input: string): string;
	}
	export var pd: PrettyData;
}
