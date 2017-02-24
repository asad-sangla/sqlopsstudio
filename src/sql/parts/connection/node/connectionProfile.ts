/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';

import { IConnectionProfile, AuthenticationTypes } from './interfaces';
import { ConnectionCredentials } from './connectionCredentials';
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
    public connection: vscode.ConnectionInfo;

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
}
