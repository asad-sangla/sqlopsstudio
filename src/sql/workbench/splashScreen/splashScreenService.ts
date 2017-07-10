/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IInstantiationService, createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { SplashDialogWidget } from './splashDialogWidget';
import { TPromise } from 'vs/base/common/winjs.base';

export const SERVICE_ID = 'splashScreenService';

export const ISplashScreenService = createDecorator<ISplashScreenService>(SERVICE_ID);

export interface ISplashScreenService {
	_serviceBrand: any;

	showSplashScreen(): TPromise<void>;

	hideSplashScreen(): void;
}

export class SplashScreenService implements ISplashScreenService {

	public _serviceBrand: any;
	private _dialog: SplashDialogWidget;

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService
	) { }

	public showSplashScreen(): TPromise<void> {
		return new TPromise<void>(() => {
			this.doShowDialog();
		});
	}

	public hideSplashScreen(): void {
		this._dialog.close();
	}

	private doShowDialog(): TPromise<void> {
		if (!this._dialog) {
			this._dialog = this._instantiationService.createInstance(SplashDialogWidget);
			this._dialog.render();
		}

		return new TPromise<void>(() => {
			this._dialog.open();
		});
	}
}
