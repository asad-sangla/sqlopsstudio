/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export class PathUtilities {

	/*
	* Public method to import image files for angular
	*/
	public static toUrl(path: string) {
		/* the baseUrl for the uri comes
		 * denormalized, so normalize the full
		 * path again here
		 */
		var space = new RegExp(' ', 'g');
		return require.toUrl(path).replace(space, '%20');
	}
}