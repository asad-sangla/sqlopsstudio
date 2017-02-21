/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { EditorInput } from 'vs/workbench/common/editor';

/**
 * Input for the QueryResultsEditor. This input helps with logic for the viewing and editing of
 * data in the results grid.
 */
export class QueryResultsInput extends EditorInput {

	static get ID() { return 'workbench.query.input'; }

	constructor() {
		super();
	}

	getTypeId(): string {
		return QueryResultsInput.ID;
	}

	getName(): string {
		return localize('extensionsInputName', 'Extension');
	}

	matches(other: any): boolean {
		if (!other || !(other instanceof QueryResultsInput)) {
			return false;
		}

		return true;
	}

	resolve(refresh?: boolean): TPromise<any> {
		return TPromise.as(null);
	}

	supportsSplitEditor(): boolean {
		return false;
	}
}