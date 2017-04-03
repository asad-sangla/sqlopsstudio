/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { IInstantiationService, createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { SplashDialogWidget } from './splashDialogWidget';
import { withElementById } from 'vs/base/browser/builder';
import { TPromise } from 'vs/base/common/winjs.base';

export const SERVICE_ID = 'splashScreenService';

export const ISplashScreenService = createDecorator<ISplashScreenService>(SERVICE_ID);

export interface ISplashScreenService {
	_serviceBrand: any;

	showSplashScreen(): TPromise<void>;

	hideSplashScreen(): void;
}

export class SplashScreenService implements ISplashScreenService  {

	_serviceBrand: any;

	private _dialog: SplashDialogWidget;
	private _container: HTMLElement;

	constructor(
		@IPartService private _partService: IPartService,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
	}

	public showSplashScreen(): TPromise<void>  {
		return new TPromise<void>(() => {
			this.doShowDialog();
		});
	}

	public hideSplashScreen(): void {
		this._dialog.close();
	}

	private doShowDialog(): TPromise<void> {
		if (!this._dialog) {
			let container = withElementById(this._partService.getWorkbenchElementId()).getHTMLElement().parentElement;
			this._container = container;
			this._dialog = this._instantiationService.createInstance(SplashDialogWidget, container);
			this._dialog.create();
		}

		return new TPromise<void>(() => {
			this._dialog.open();
		});
	}
}
