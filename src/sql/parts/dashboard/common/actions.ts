/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Action } from 'vs/base/common/actions';
import * as nls from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';

export class RefreshWidgetAction extends Action {

	private static readonly ID = 'refreshWidget';
	private static readonly LABEL = nls.localize('refreshWidget', 'Refresh');
	private static readonly ICON = 'refresh';

	constructor(
		private refreshFn: () => void,
		private context: any // this
	) {
		super(RefreshWidgetAction.ID, RefreshWidgetAction.LABEL, RefreshWidgetAction.ICON);
	}

	run(): TPromise<boolean> {
		try {
			this.refreshFn.apply(this.context);
			return TPromise.as(true);
		} catch (e) {
			return TPromise.as(false);
		}
	}
}
