/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import * as crypto from 'crypto';
import * as os from 'os';
import { ITelemetryService, ITelemetryData } from 'vs/platform/telemetry/common/telemetry';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { warn } from 'sql/base/common/log';

// Generate a new GUID
export function generateGuid(): string {
	let hexValues: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
	// c.f. rfc4122 (UUID version 4 = xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
	let oct: string = '';
	let tmp: number;
	/* tslint:disable:no-bitwise */
	for (let a: number = 0; a < 4; a++) {
		tmp = (4294967296 * Math.random()) | 0;
		oct += hexValues[tmp & 0xF] +
			hexValues[tmp >> 4 & 0xF] +
			hexValues[tmp >> 8 & 0xF] +
			hexValues[tmp >> 12 & 0xF] +
			hexValues[tmp >> 16 & 0xF] +
			hexValues[tmp >> 20 & 0xF] +
			hexValues[tmp >> 24 & 0xF] +
			hexValues[tmp >> 28 & 0xF];
	}

	// 'Set the two most significant bits (bits 6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively'
	let clockSequenceHi: string = hexValues[8 + (Math.random() * 4) | 0];
	return oct.substr(0, 8) + '-' + oct.substr(9, 4) + '-4' + oct.substr(13, 3) + '-' + clockSequenceHi + oct.substr(16, 3) + '-' + oct.substr(19, 12);
	/* tslint:enable:no-bitwise */
}

// Generate a unique, deterministic ID for the current user of the extension
export function generateUserId(): Promise<string> {
	return new Promise<string>(resolve => {
		try {
			getmac.getMac((error, macAddress) => {
				if (!error) {
					resolve(crypto.createHash('sha256').update(macAddress + os.homedir(), 'utf8').digest('hex'));
				} else {
					resolve(generateGuid()); // fallback
				}
			});
		} catch (err) {
			resolve(generateGuid()); // fallback
		}
	});
}

export interface IConnectionTelemetryData extends ITelemetryData {
	connection?: IConnectionProfile;
	provider?: string;
}

/**
 * Call the given telemetry service to log the telemetry event.
 * If the provider is not in the data, tries to get it from connection inside the data.
 * The connection in the data won't be included in the telemetry data
 * Note: userId is added to all telemetry events so no need to add it here
 * @param telemetryService Telemetry Service
 * @param telemetryEventName Telemetry event name
 * @param data Telemetry data
 */
export function addTelemetry(telemetryService: ITelemetryService, telemetryEventName: string, data?: IConnectionTelemetryData): Promise<void> {
	return new Promise<void>(resolve => {
		try {
			let telData: ITelemetryData = data === undefined ? {} : data;

			if (telData && telData.provider === undefined) {

				let provider: string = '';
				if (telData.connection) {
					provider = telData.connection.providerName;
				}
				telData.provider = provider;
			}
			delete telData['connection'];
			if (telemetryService) {
				telemetryService.publicLog(telemetryEventName, telData).then(() => {
					resolve();
				}, telemetryServiceError => {
					warn(`Failed to add telemetry. error: ${telemetryServiceError}`);
					resolve();
				});
			} else {
				resolve();
			}
		} catch (error) {
			warn(`Failed to add telemetry. error: ${error}`);
			resolve();
		}
	});
}