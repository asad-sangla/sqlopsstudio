/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import * as nls from 'vs/nls';

import { IMessageService, Severity } from 'vs/platform/message/common/message';

export interface IChartViewActionContext {
	copyChart(): void;
	saveChart(): void;
	createInsight(): void;
}

export class ChartViewActionBase extends Action {
	public static BaseClass = 'queryTaskbarIcon';
	private _classes: string[];

	constructor(
		id: string,
		label: string,
		enabledClass: string,
		protected messageService: IMessageService
	) {
		super(id, label);
		this.enabled = true;
		this._setCssClass(enabledClass);
	}
	protected updateCssClass(enabledClass: string): void {
		// set the class, useful on change of label or icon
		this._setCssClass(enabledClass);
	}

	/**
	 * Sets the CSS classes combining the parent and child classes.
	 * Public for testing only.
	 */
	private _setCssClass(enabledClass: string): void {
		this._classes = [];
		this._classes.push(ChartViewActionBase.BaseClass);

		if (enabledClass) {
			this._classes.push(enabledClass);
		}
		this.class = this._classes.join(' ');
	}

	protected doRun(context: IChartViewActionContext, runAction: Function): TPromise<boolean> {
		if (!context) {
			// TODO implement support for finding chart view in active window
			this.messageService.show(Severity.Error, nls.localize('chartContextRequired', 'Chart View context is required to run this action'));
			return TPromise.as(false);
		}
		return new TPromise<boolean>((resolve, reject) => {
			runAction();
			resolve(true);
		});
	}

}

export class CreateInsightAction extends ChartViewActionBase {
	public static ID = 'chartview.createInsight';
	public static LABEL = nls.localize('createInsightLabel', "Create Insight");

	constructor(@IMessageService messageService: IMessageService
	) {
		super(CreateInsightAction.ID, CreateInsightAction.LABEL, 'createInsight', messageService);
	}

	public run(context: IChartViewActionContext): TPromise<boolean> {
		return this.doRun(context, () => context.createInsight());
	}
}

export class CopyAction extends ChartViewActionBase {
	public static ID = 'chartview.copy';
	public static LABEL = nls.localize('copyChartLabel', "Copy as image");

	constructor(@IMessageService messageService: IMessageService
	) {
		super(CopyAction.ID, CopyAction.LABEL, 'copyImage', messageService);
	}

	public run(context: IChartViewActionContext): TPromise<boolean> {
		return this.doRun(context, () => context.copyChart());
	}
}

export class SaveImageAction extends ChartViewActionBase {
	public static ID = 'chartview.saveImage';
	public static LABEL = nls.localize('saveImageLabel', "Save as image");

	constructor(@IMessageService messageService: IMessageService
	) {
		super(SaveImageAction.ID, SaveImageAction.LABEL, 'saveAsImage', messageService);
	}

	public run(context: IChartViewActionContext): TPromise<boolean> {
		return this.doRun(context, () => context.saveChart());
	}
}