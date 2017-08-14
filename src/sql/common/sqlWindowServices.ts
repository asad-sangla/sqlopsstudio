/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';

export interface SaveDialogOptions {
	title?: string;
	defaultPath?: string;
	/**
	 * Custom label for the confirmation button, when left empty the default label will be used.
	 */
	buttonLabel?: string;
	/**
	 * File types that can be displayed, see dialog.showOpenDialog for an example.
	 */
	filters?: {
		name: string;
		extensions: string[];
	}[];
}


export const ISqlWindowService = createDecorator<ISqlWindowService>('sqlWindowService');

/**
 * Defines simple window / electron based util methods to avoid breaking the layering issues
 * caused when certain electron-based services are referenced in unit testable code
 *
 * @export
 * @interface ISqlWindowService
 */
export interface ISqlWindowService {

	_serviceBrand: any;

	/**
	 * Shows a save dialog and returns the file path chosen to be saved to
	 *
	 * @param {SaveDialogOptions} options
	 * @returns {string}
	 * @memberof IWindowUtils
	 */
	showSaveDialog(options: SaveDialogOptions): string;

	/**
	 * Writes the image into the clipboard. Data is expected to come
	 * from a .toDataUrl method call on a blob or similar object
	 */
	writeImageFromDataUrl(dataUrl: string): void;
}