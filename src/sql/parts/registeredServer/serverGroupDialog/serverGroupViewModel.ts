/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { IConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import * as DialogHelper from 'sql/parts/common/modal/dialogHelper';
import * as TypeChecker from 'vs/base/common/types';
import { localize } from 'vs/nls';

export class ServerGroupViewModel {
	public groupName: string;
	public groupDescription: string;
	public groupColor: string;
	public colors: string[] = ['#515151', '#004760', '#771b00', '#700060', '#a17d01', '#006749', '#654502', '#3A0293'];

	private _domainModel: IConnectionProfileGroup;
	private _editMode: boolean;
	private readonly _addServerGroupTitle: string = localize('addServerGroup', 'Add server group');
	private readonly _editServerGroupTitle: string = localize('editServerGroup', 'Edit server group');
	private readonly _defaultColor: string = '#515151';

	constructor (domainModel?: IConnectionProfileGroup)
	{
		// keep reference to domain model to be able to see if there are pending changes
		if (domainModel) {
			this._domainModel = domainModel;

			// initialize the view model properties
			this.groupName = domainModel.name;
			this.groupColor = domainModel.color;
			this.groupDescription = domainModel.description;

			this._editMode = true;
		}
		else {
			// initialize defaults for a new group
			this.groupName = '';
			this.groupDescription = '';
			this.groupColor = this._defaultColor;

			this._editMode = false;
		}
	}

	// check to see if the current state of the view model is different than the data in the domain model
	public hasPendingChanges(): boolean {
		if (!TypeChecker.isUndefinedOrNull(this._domainModel)) {
			return ((DialogHelper.isNullOrWhiteSpace(this.groupName) === false) &&
					((this.groupName !== this._domainModel.name) ||
					(this.groupDescription !== this._domainModel.description) ||
					(this.groupColor !== this._domainModel.color)));
		}
		else {
			return (DialogHelper.isNullOrWhiteSpace(this.groupName) === false);
		}
	}

	public getDialogTitle(): string {
		if (this._editMode === true) {
			return this._editServerGroupTitle;
		} else {
			return this._addServerGroupTitle;
		}
	}
}