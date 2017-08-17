/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IProfilerService } from './service/interfaces';

import { TPromise } from 'vs/base/common/winjs.base';
import * as pfs from 'vs/base/node/pfs';
import * as path from 'path';

import * as data from 'data';

declare var __dirname;

const columns = [
	'EventClass',
	'TextData',
	'ApplicationName',
	'NTUserName',
	'LoginName',
	'CPU',
	'Reads',
	'Writes',
	'Duration',
	'ClientProcessID',
	'SPID',
	'StartTime',
	'EndTime',
	'BinaryData'
];

export class ProfilerTestBackend implements data.IProfilerProvider {
	private index = 0;
	private timeOutMap = new Map<string, number>();
	private testData: Array<Array<string>> = new Array<Array<string>>();

	constructor(
		@IProfilerService private _profilerService: IProfilerService) { }

	startSession(guid: string): Thenable<boolean> {
		this.timeOutMap.set(guid, this.intervalFn(guid));
		return TPromise.as(true);
	}

	private intervalFn(guid: string): number {
		return setTimeout(() => {
			this._profilerService.onMoreRows({ uri: guid, rowCount: 1, data: this.testData[this.index++] });
			if (this.index >= this.testData.length) {
				this.index = 0;
			}
			this.timeOutMap.set(guid, this.intervalFn(guid));
		}, Math.floor(Math.random() * 1000) + 300);
	}

	getColumns(): Thenable<Array<string>> {
		return TPromise.as(columns);
	}

	stopSession(guid: string): Thenable<boolean> {
		clearTimeout(this.timeOutMap.get(guid));
		this.index = 0;
		return TPromise.as(true);
	}

	pauseSession(guid: string): Thenable<boolean> {
		clearTimeout(this.timeOutMap.get(guid));
		return TPromise.as(true);
	}

	connectSession(): Thenable<boolean> {
		if(this.testData.length === 0 ) {
			return new TPromise<boolean>((resolve, reject) => {
				pfs.readFile(path.join(__dirname, 'testData.tsv')).then(result => {
					let tabsep = result.toString().split('\t');
					for(let i = 0; i < tabsep.length; i++) {
						if (i % columns.length === 0) {
							this.testData[i / columns.length] = new Array<string>();
						}
						this.testData[Math.floor(i / columns.length)][i % columns.length] = tabsep[i];
					};
					resolve(true);
				});
			});
		} else {
			return TPromise.as(true);
		}
	}

	disconnectSession(guid: string): Thenable<boolean> {
		clearTimeout(this.timeOutMap.get(guid));
		this.index = 0;
		return TPromise.as(true);
	}
}
