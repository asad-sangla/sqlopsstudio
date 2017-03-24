/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

'use strict';

import * as interfaces from 'sql/parts/connection/common/interfaces';

// TODO: this class might not be needed.
// The only method in this class needed to be changed to be more generic for all providers
export class ConnectionCredentials {

	public static isPasswordBasedCredential(credentials: interfaces.IConnectionProfile): boolean {
		// TODO consider enum based verification and handling of AD auth here in the future
		let authenticationType = credentials.authenticationType;
		if (typeof credentials.authenticationType === 'undefined') {
			authenticationType = ConnectionCredentials.authTypeToString(interfaces.AuthenticationTypes.SqlLogin);
		}
		return authenticationType === ConnectionCredentials.authTypeToString(interfaces.AuthenticationTypes.SqlLogin);
	}

	public static authTypeToString(value: interfaces.AuthenticationTypes): string {
		return interfaces.AuthenticationTypes[value];
	}
}

