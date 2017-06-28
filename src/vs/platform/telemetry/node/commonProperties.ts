/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as Platform from 'vs/base/common/platform';
import * as os from 'os';
import { TPromise } from 'vs/base/common/winjs.base';
import * as uuid from 'vs/base/common/uuid';

// {{SQL CARBON EDIT}}
import product from 'vs/platform/node/product';
import * as Utils from 'sql/common/telemetryUtilities';
import { IStorageService } from 'vs/code/electron-main/storage';

export const machineIdStorageKey = 'telemetry.machineId';
export const machineIdIpcChannel = 'vscode:machineId';

export function resolveCommonProperties(commit: string, version: string, storageService?: IStorageService): TPromise<{ [name: string]: string; }> {
	const result: { [name: string]: string; } = Object.create(null);

	result['sessionID'] = uuid.generateUuid() + Date.now();
	result['commitHash'] = commit;
	result['version'] = version;
	result['common.osVersion'] = os.release();
	result['common.platform'] = Platform.Platform[Platform.platform];
	result['common.nodePlatform'] = process.platform;
	result['common.nodeArch'] = process.arch;

	// {{SQL CARBON EDIT}}
	result['common.application.name'] = product.nameLong;
	if (storageService) {
		getUserId(storageService).then(value => result['common.userid'] = value);
	}

	// dynamic properties which value differs on each call
	let seq = 0;
	const startTime = Date.now();
	Object.defineProperties(result, {
		'timestamp': {
			get: () => new Date(),
			enumerable: true
		},
		'common.timesincesessionstart': {
			get: () => Date.now() - startTime,
			enumerable: true
		},
		'common.sequence': {
			get: () => seq++,
			enumerable: true
		}
	});

	return TPromise.as(result);
}

// {{SQL CARBON EDIT}}

// Get the unique ID for the current user
function getUserId(storageService: IStorageService): Promise<string> {
	var userId = storageService.getItem<string>('common.userId');
	return new Promise<string>(resolve => {
		// Generate the user id if it has not been created already
		if (typeof userId === 'undefined') {
			let id = Utils.generateUserId();
			id.then( newId => {
				userId = newId;
				resolve(userId);
				//store the user Id in the storage service
				storageService.setItem('common.userId', userId);
			});
		} else {
			resolve(userId);
		}
	});
}