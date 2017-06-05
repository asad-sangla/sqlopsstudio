/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export class PathUtilities {

	/*
	* Public method to import html/css/image files for angular
	*/
	public static toUrl(path: string) {
		return require.toUrl(path).replace(' ', '%20');
	}

}