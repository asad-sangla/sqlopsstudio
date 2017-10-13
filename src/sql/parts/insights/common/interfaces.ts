/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import Event from 'vs/base/common/event';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';

import { IInsightsConfigDetails, IInsightsConfig } from 'sql/parts/dashboard/widgets/insights/interfaces';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ITaskActionContext } from 'sql/workbench/common/actions';

export interface IInsightsDialogModel {
	rows: string[][];
	columns: string[];
	getListResources(labelIndex: number, valueIndex: number): ListResource[];
	onDataChange: Event<void>;
	insight: IInsightsConfigDetails;
}

export interface ListResource {
	value: string;
	label: string;
	icon?: string;
	data?: string[];
	stateColor?: string;
	stateIcon?: string;
}

export const IInsightsDialogService = createDecorator<IInsightsDialogService>('insightsDialogService');

export interface IInsightsDialogService {
	_serviceBrand: any;
	show(input: IInsightsConfig, connectionProfile: IConnectionProfile): void;
	close();
}

export interface IInsightDialogActionContext extends ITaskActionContext {
	cellData: string;
}
