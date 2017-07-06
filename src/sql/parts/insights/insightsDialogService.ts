/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { createDecorator, IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import InsightsDialog from './insightsDialog';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { InsightsConfig } from 'sql/parts/dashboard/widgets/insights/insightsWidget.component';

import { SimpleExecuteResult } from 'data';

export const IInsightsDialogService = createDecorator<IInsightsDialogService>('insightsDialogService');

export interface IInsightsDialogService {
	_serviceBrand: any;
	show(input: InsightsConfig, connectionProfile: IConnectionProfile);
	show(input: SimpleExecuteResult);
	close();
}

export class InsightsDialogService implements IInsightsDialogService {
	_serviceBrand: any;
	private _insightsDialog: InsightsDialog;

	constructor( @IInstantiationService private _instantiationService: IInstantiationService) { }

	// query string
	public show(input: InsightsConfig, connectionProfile: IConnectionProfile): void;
	// query results
	public show(input: SimpleExecuteResult): void;
	// insight object
	public show(input?: any, connectionProfile?: IConnectionProfile): void {
		if (!this._insightsDialog) {
			this._insightsDialog = this._instantiationService.createInstance(InsightsDialog);
		}

		this._insightsDialog.show(input, connectionProfile);
	}

	public close(): void {
		this._insightsDialog.close();
	}
}
