/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { IErrorMessageService } from 'sql/parts/connection/common/connectionManagement';
import Severity from 'vs/base/common/severity';

export class ErrorMessageServiceStub implements IErrorMessageService {
	_serviceBrand: any;
	showDialog(severity: Severity, headerTitle: string, message: string): void {
	}
}