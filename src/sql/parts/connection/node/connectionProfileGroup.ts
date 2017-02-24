/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionProfile } from './interfaces';

export interface IConnectionProfileGroup {
	name: string;
	children: IConnectionProfileGroup[];
};

export class ConnectionProfileGroup implements IConnectionProfileGroup {

	public children: ConnectionProfileGroup[];
	private connections: IConnectionProfile[];

	public constructor(
		public name: string,

		private parent: ConnectionProfileGroup
		) {
	}

	public static GroupNameSeparator: string = '/';

	public set Connections(connection: IConnectionProfile[]) {
		this.connections = connection;
	}

	public get Connections(): IConnectionProfile[] {
		return this.connections;
	}

	public get GroupName(): string {
		return this.name;
	}

	public set Children(children: ConnectionProfileGroup[]) {
		this.children = children;
	}

	public get Children(): ConnectionProfileGroup[] {
		return this.children;
	}

	public get FullName(): string {
		let fullName: string = this.name;
		if(this.parent) {
			fullName = this.parent.FullName + ConnectionProfileGroup.GroupNameSeparator + this.name;
		}

		return fullName;
	}
}