/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';

import { IConnectionProfile, AuthenticationTypes } from './interfaces';
import { ConnectionCredentials } from './connectionCredentials';
import { ConnectionProfileGroup } from './connectionProfileGroup';
import { QuestionTypes, IQuestion, IPrompter, INameValueChoice } from './question';
import * as utils from './utils';
import vscode = require('vscode');

// Concrete implementation of the IConnectionProfile interface

/**
 * A concrete implementation of an IConnectionProfile with support for profile creation and validation
 */
export class ConnectionProfile extends ConnectionCredentials implements IConnectionProfile {
    public profileName: string;
    public savePassword: boolean;
    public groupName: string;
    public groupId: string;
    public parent: ConnectionProfileGroup = null;
    public serverName: string;
	public databaseName: string;
	public type: string;
	public id: string;
	public userName: string;
	public authenticationType: string;

	constructor(connectionProfile: IConnectionProfile) {
		super();
		this.savePassword = connectionProfile.savePassword;
		this.groupName = connectionProfile.groupName;
		this.serverName = connectionProfile.serverName;
		this.databaseName = connectionProfile.databaseName;
		this.userName = connectionProfile.userName;
		this.authenticationType = connectionProfile.authenticationType;
		this.groupId = connectionProfile.groupId;
		this.id = this.groupId + ConnectionProfileGroup.GroupNameSeparator +
					this.serverName + ConnectionProfileGroup.GroupNameSeparator +
					this.databaseName + ConnectionProfileGroup.GroupNameSeparator +
					this.authenticationType + ConnectionProfileGroup.GroupNameSeparator +
					this.userName;
		this.type = 'SQL';
	}

    // Assumption: having server + profile name indicates all requirements were met
    private isValidProfile(): boolean {
        if (this.authenticationType) {
            if (this.authenticationType === AuthenticationTypes[AuthenticationTypes.Integrated]) {
                return utils.isNotEmpty(this.serverName);
            } else {
                return utils.isNotEmpty(this.serverName)
                    && utils.isNotEmpty(this.userName);
            }
        }
        return false;
    }

    public get fullName(): string {
		let fullName: string = this.groupId + ConnectionProfileGroup.GroupNameSeparator ;
		if(this.parent) {
			fullName = this.parent.fullName + ConnectionProfileGroup.GroupNameSeparator + fullName;
		}
		return fullName;
	}

	public equals(other: any): boolean {
		if (!(other instanceof ConnectionProfile)) {
			return false;
		}
		return other.id === this.id && other.serverName === this.serverName;
	}

	public getParent(): ConnectionProfileGroup {
		return this.parent;
	}
}
