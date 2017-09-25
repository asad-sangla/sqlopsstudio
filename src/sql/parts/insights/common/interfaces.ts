/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import Event from 'vs/base/common/event';
import { IInsightsConfigDetails } from 'sql/parts/dashboard/widgets/insights/interfaces';

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
