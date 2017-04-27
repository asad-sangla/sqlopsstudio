/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ConnectionSummary } from 'data';
import { IStatusbarService } from 'vs/platform/statusbar/common/statusbar';
import * as Constants from 'sql/parts/connection/common/constants';

// Status when making connections from the viewlet
export class ConnectionGlobalStatus {

	private _displayTime: number = 5000; // (in ms)

	constructor(
		@IStatusbarService private _statusBarService: IStatusbarService
	) {
	}

	public setStatusToConnected(connectionSummary: ConnectionSummary): void {
		if (this._statusBarService) {
			let text: string;
			let connInfo: string = connectionSummary.serverName;
			if (connInfo) {
				if (connectionSummary.databaseName && connectionSummary.databaseName !== '') {
					connInfo = connInfo + ' : ' + connectionSummary.databaseName;
				} else {
					connInfo = connInfo + ' : ' + '<default>';
				}
				text = Constants.onDidConnectMessage + ' ' + connInfo;
			}
			this._statusBarService.setStatusMessage(text, this._displayTime);
		}
	}

	public setStatusToDisconnected(fileUri: string): void {
		if (this._statusBarService) {
			this._statusBarService.setStatusMessage(Constants.onDidDisconnectMessage, this._displayTime);
		}
	}
}