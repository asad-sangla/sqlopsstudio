/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';


import { ISqlWindowService, SaveDialogOptions } from 'sql/common/sqlWindowServices';

import { IWindowIPCService } from 'vs/workbench/services/window/electron-browser/windowService';
import { clipboard, nativeImage  } from 'electron';

/**
 * Defines simple window / electron based util methods to avoid breaking the layering issues
 * caused when certain electron-based services are referenced in unit testable code
 *
 * @export
 * @interface ISqlWindowService
 */
export class SqlWindowService implements ISqlWindowService {

	public _serviceBrand: any;

	constructor(@IWindowIPCService private _windowIpcService: IWindowIPCService) {
	}

	/**
	 * Shows a save dialog and returns the file path chosen to be saved to
	 *
	 * @param {SaveDialogOptions} options
	 * @returns {string}
	 * @memberof IWindowUtils
	 */
	public showSaveDialog(options: SaveDialogOptions): string {
		return this._windowIpcService.getWindow().showSaveDialog(options);
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