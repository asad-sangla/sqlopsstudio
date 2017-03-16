/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionProfile } from './interfaces';
import { ConnectionProfile } from './connectionProfile';
import data = require('data');

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
		let fullName: string = (this.id === 'root') ? undefined : this.id;
		if (this._parent) {
			let parentFullName = this._parent.fullName;
			if (parentFullName) {
				fullName = parentFullName + ConnectionProfileGroup.GroupNameSeparator + this.id;
			}
		}
		return fullName;
	}

	public hasChildren(): boolean {
		if ((this.children && this.children.length > 0) || (this.connections && this.connections.length > 0)) {
			return true;
		}
		return false;
	}

	public getChildren(): any {
		let allChildren = [];

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

	public getParent(): ConnectionProfileGroup {
		return this._parent;
	}
}