/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { EditorInput } from 'vs/workbench/common/editor';
import { IExtension } from 'vs/workbench/parts/extensions/common/extensions';

export class QueryInput extends EditorInput {

	static get ID() { return 'workbench.query.input2'; }
	get extension(): IExtension { return this._extension; }

	constructor(private _extension: IExtension) {
		super();
	}

	getTypeId(): string {
		return QueryInput.ID;
	}

	getName(): string {
		return localize('extensionsInputName', "Extension: {0}", this.extension.displayName);
	}

	matches(other: any): boolean {
		if (!(other instanceof QueryInput)) {
			return false;
		}

		const otherExtensionInput = other as QueryInput;

		// TODO@joao is this correct?
		return this.extension === otherExtensionInput.extension;
	}

	resolve(refresh?: boolean): TPromise<any> {
		return TPromise.as(null);
	}

	supportsSplitEditor(): boolean {
		return false;
	}
}
