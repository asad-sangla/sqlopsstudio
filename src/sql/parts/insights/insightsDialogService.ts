/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { createDecorator, IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { InsightsDialogController } from './node/insightsDialogController';
import { InsightsDialogView } from './browser/insightsDialogView';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IInsightsConfig } from 'sql/parts/dashboard/widgets/insights/interfaces';
import { IInsightsDialogModel } from './common/interfaces';
import { InsightsDialogModel } from './common/insightsDialogModel';

export const IInsightsDialogService = createDecorator<IInsightsDialogService>('insightsDialogService');

export interface IInsightsDialogService {
	_serviceBrand: any;
	show(input: IInsightsConfig, connectionProfile: IConnectionProfile): void;
	close();
}

export class InsightsDialogService implements IInsightsDialogService {
	_serviceBrand: any;
	private _insightsDialogController: InsightsDialogController;
	private _insightsDialogView: InsightsDialogView;
	private _insightsDialogModel: IInsightsDialogModel;

	constructor( @IInstantiationService private _instantiationService: IInstantiationService) { }

	// query string
	public show(input: IInsightsConfig, connectionProfile: IConnectionProfile): void {
		if (!this._insightsDialogView) {
			this._insightsDialogModel = new InsightsDialogModel();
			this._insightsDialogController = this._instantiationService.createInstance(InsightsDialogController, this._insightsDialogModel);
			this._insightsDialogView = this._instantiationService.createInstance(InsightsDialogView, this._insightsDialogModel);
			this._insightsDialogView.render();
		}

		this._insightsDialogModel.insight = input.details;
		this._insightsDialogController.update(input.details, connectionProfile);
		this._insightsDialogView.open(input.details, connectionProfile);
	}

	public close(): void {
		this._insightsDialogView.close();
	}
}
