/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionProfile } from './interfaces';
import { ConnectionProfile } from './connectionProfile';
import vscode = require('vscode');

export interface IConnectionProfileGroup {
	id: string;
	parentId: string;
	name: string;
}

export class ConnectionProfileGroup implements IConnectionProfileGroup {

	public children: ConnectionProfileGroup[];
	public connections: ConnectionProfile[];
	public parentId: string;
	public constructor(
		public name: string,
		private _parent: ConnectionProfileGroup,
		public id: string
	) {
		this.parentId = _parent ? _parent.id : undefined;
	}

	public static GroupNameSeparator: string = '/';

	public toObject(): IConnectionProfileGroup {
		let subgroups = undefined;
		if (this.children) {
			subgroups = [];
			this.children.forEach((group) => {
			subgroups.push(group.toObject());
		});
		}

		return Object.assign({},{name: this.name, id: this.id, parentId: this.parentId, children: subgroups});
	}

	public get groupName(): string {
		return this.name;
	}

	public get fullName(): string {
		let fullName: string = (this.name === 'root') ? undefined : this.name;
		if (this._parent) {
			var parentFullName = this._parent.fullName;
			if (parentFullName) {
				fullName = parentFullName + ConnectionProfileGroup.GroupNameSeparator + this.name;
			}
		}
		return fullName;
	}

	public get serverName(): string {
		return this.name;
	}

	public hasChildren(): boolean {
		if ((this.children && this.children.length > 0) || (this.connections && this.connections.length > 0)) {
			return true;
		}
		return false;
	}

	public getChildren(): any {
		var allChildren = [];

		if (this.connections) {
			this.connections.forEach((conn) => {
				allChildren.push(conn);
			});
		}

		if (this.children) {
			this.children.forEach((group) => {
				allChildren.push(group);
			});
		}
		return allChildren;
	}

	public equals(other: any): boolean {
		if (!(other instanceof ConnectionProfileGroup)) {
			return false;
		}
		return other.name === this.name;
	}

	public addConnections(connections: ConnectionProfile[]): void {
		if (!this.connections) {
			this.connections = [];
		}
		connections.forEach((conn) => {
			conn.parent = this;
			this.connections.push(conn);
		});

	}

	public addGroups(groups: ConnectionProfileGroup[]): void {
		if (!this.children) {
			this.children = [];
		}
		groups.forEach((group) => {
			group._parent = this;
			this.children.push(group);
		});
	}

	public updateGroup(child: ConnectionProfileGroup): void {
		var index = this.children.indexOf(child);
		if (index !== -1) {
			this.children[index] = child;
		}
	}

	public removeConnection(child: ConnectionProfile): void {
		var connections = this.connections;
		connections.forEach((val, i) => {
			if (val.equals(child)) {
				connections.splice(i, 1);
			}
		});
		this.connections = connections;
		child.parent = null;
		if (this.children.length === 0) {
			this.children = null;
		}
	}

	public removeGroup(child: ConnectionProfileGroup): void {
		var groups = this.children;
		groups.forEach((val, i) => {
			if (val.equals(child)) {
				groups.splice(i, 1);
			}
		});
		this.children = groups;
		child._parent = null;
		if (this.children.length === 0) {
			this.children = null;
		}
	}

	public addGroup(child: ConnectionProfileGroup): void {
		var servers = this.children;
		if (!this.children) {
			this.children = [child];
			child._parent = this;
		}
		else if (!servers.some(x => x.equals(child))) {
			servers.push(child);
			child._parent = this;
			this.children = servers;
		}
	}

	public getParent(): ConnectionProfileGroup {
		return this._parent;
	}
}