/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { ConnectionProfileWrapper } from 'sql/parts/registeredServer/common/connectionProfileWrapper';
import { IObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';

export class ConnectionProfileGroupWrapper extends ConnectionProfileGroup {
	public constructor(
		name: string,
		parent: ConnectionProfileGroup,
		id: string,
		children: ConnectionProfileGroup[],
		connections: ConnectionProfile[],
		private _objectExplorerService: IObjectExplorerService,
		private _connectionManagementService: IConnectionManagementService) {
		super(name, parent, id);
		this.children = children;
		this.connections = connections;
	}

	public getChildren(): any {
		let allChildren = [];

		if (this.connections) {
			this.connections.forEach((conn) => {
				let connectionWrapper = new ConnectionProfileWrapper(conn.ServerCapabilities, conn.toIConnectionProfile(), this._objectExplorerService, this._connectionManagementService);
				allChildren.push(connectionWrapper);
			});
		}

		if (this.children) {
			this.children.forEach((group) => {
				let groupWrapper = new ConnectionProfileGroupWrapper(group.name, group.parent, group.id, group.children, group.connections, this._objectExplorerService, this._connectionManagementService);
				allChildren.push(groupWrapper);
			});
		}
		return allChildren;
	}
}