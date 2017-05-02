/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import data = require('data');
import * as interfaces from 'sql/parts/connection/common/interfaces';
import { IObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { TPromise } from 'vs/base/common/winjs.base';

export class ConnectionProfileWrapper extends ConnectionProfile {

	public constructor(
		serverCapabilities: data.DataProtocolServerCapabilities,
		model: interfaces.IConnectionProfile,
		private _objectExplorerService: IObjectExplorerService,
		private _connectionManagementService: IConnectionManagementService
	) {
		super(serverCapabilities, model);
	}

	public hasChildren(): boolean {
		return this._connectionManagementService.isConnected(undefined, this);
	}

	public getChildren(): TPromise<any> {
		if (this.hasChildren()) {
			var rootNode = this._objectExplorerService.getTopLevelNode(this);
			return new TPromise<TreeNode[]>((resolve) => {
				this._objectExplorerService.expandTreeNode(rootNode.getSession(), rootNode).then(() => {
					resolve(rootNode.children);
				});
			});
		} else {
			return TPromise.as(null);
		}
	}
}
