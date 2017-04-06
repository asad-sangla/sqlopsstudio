/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { TPromise } from 'vs/base/common/winjs.base';
import { ITree } from 'vs/base/parts/tree/browser/tree';
import { ContributableActionProvider } from 'vs/workbench/browser/actionBarRegistry';
import { IAction } from 'vs/base/common/actions';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ConnectionProfileGroup } from '../common/connectionProfileGroup';
import { ConnectionProfile } from '../common/connectionProfile';
import { EditDataAction } from 'sql/workbench/electron-browser/actions';
import { AddServerAction, NewQueryAction} from 'sql/parts/connection/viewlet/connectionTreeAction';

/**
 *  Provides actions for the server tree elements
 */
export class ServerTreeActionProvider extends ContributableActionProvider {

	constructor(
		@IInstantiationService private instantiationService: IInstantiationService
	) {
		super();
	}

	public hasActions(tree: ITree, element: any): boolean {
		return element instanceof ConnectionProfileGroup || (element instanceof ConnectionProfile);
	}

	/**
	 * Return actions given an element in the tree
	 */
	public getActions(tree: ITree, element: any): TPromise<IAction[]> {
		if (element instanceof ConnectionProfile) {
			return TPromise.as(this.getConnectionActions(this.instantiationService));
		}
		if (element instanceof ConnectionProfileGroup) {
			return TPromise.as(this.getConnectionProfileGroupActions(this.instantiationService));
		}

		return TPromise.as([]);
	}

	public hasSecondaryActions(tree: ITree, element: any): boolean {
		return false;
	}

	public getSecondaryActions(tree: ITree, element: any): TPromise<IAction[]> {
		return super.getSecondaryActions(tree, element);
	}

		/**
	 * Return actions for connection elements
	 */
	public  getConnectionActions(instantiationService: IInstantiationService): IAction[] {
		return [
			instantiationService.createInstance(AddServerAction, AddServerAction.ID, AddServerAction.LABEL),
			instantiationService.createInstance(NewQueryAction, NewQueryAction.ID, NewQueryAction.LABEL),
			instantiationService.createInstance(EditDataAction, EditDataAction.ID, EditDataAction.LABEL)
		];
	}

	/**
	 * Return actions for connection group elements
	 */
	public  getConnectionProfileGroupActions(instantiationService: IInstantiationService): IAction[] {
		return [
			instantiationService.createInstance(AddServerAction, AddServerAction.ID, AddServerAction.LABEL)
		];
	}
}