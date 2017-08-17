/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import * as data from 'data';

const PROFILER_SERVICE_ID = 'profilerService';
export const IProfilerService = createDecorator<IProfilerService>(PROFILER_SERVICE_ID);

export type ProfilerSessionID = string;


export interface IProfilerSession {
	onMoreRows(rowCount: number, data: Array<string>);
}

export interface IProfilerService {
	_serviceBrand: any;
	registerProvider(providerId: string, provider: data.IProfilerProvider): void;
	registerSession(uri: string, session: IProfilerSession): ProfilerSessionID;
	getColumns(sessionId: ProfilerSessionID): Thenable<Array<string>>;
	connectSession(sessionId: ProfilerSessionID): Thenable<boolean>;
	disconnectSession(sessionId: ProfilerSessionID): Thenable<boolean>;
	startSession(sessionId: ProfilerSessionID): Thenable<boolean>;
	pauseSession(sessionId: ProfilerSessionID): Thenable<boolean>;
	stopSession(sessionId: ProfilerSessionID): Thenable<boolean>;
	onMoreRows(params: data.IProfilerMoreRowsNotificationParams): void;
}