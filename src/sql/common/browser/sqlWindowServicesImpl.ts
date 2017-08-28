/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';


import { ISqlWindowService } from 'sql/common/sqlWindowServices';

import { IWindowService } from 'vs/platform/windows/common/windows';
import { clipboard, nativeImage } from 'electron';

/**
 * Defines simple window / electron based util methods to avoid breaking the layering issues
 * caused when certain electron-based services are referenced in unit testable code
 *
 * @export
 * @interface ISqlWindowService
 */
export class SqlWindowService implements ISqlWindowService {

	public _serviceBrand: any;

	constructor( @IWindowService private _windowService: IWindowService) {
	}

	/**
	 * Shows a save dialog and returns the file path chosen to be saved to
	 *
	 * @param {SaveDialogOptions} options
	 * @returns {string}
	 * @memberof IWindowUtils
	 */
	public showSaveDialog(options: Electron.SaveDialogOptions): string {
		return this._windowService.showSaveDialog(options);
	}

	/**
	 * Writes the image into the clipboard. Data is expected to come
	 * from a .toDataUrl method call on a blob or similar object
	 */
	writeImageFromDataUrl(dataUrl: string): void {
		let image = nativeImage.createFromDataURL(dataUrl);
		clipboard.writeImage(image);
	}
}