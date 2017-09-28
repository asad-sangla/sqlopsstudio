/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/media/primeng';
import 'vs/css!sql/parts/grid/load/css/qp';

import { ElementRef, Component, Inject, forwardRef, OnDestroy, OnInit } from '@angular/core';
import * as QP from 'html-query-plan';

import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { QueryPlanParams } from 'sql/services/bootstrap/bootstrapParams';

import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { registerThemingParticipant, ICssStyleCollector, ITheme } from 'vs/platform/theme/common/themeService';
import * as colors from 'vs/platform/theme/common/colorRegistry';

export const QUERYPLAN_SELECTOR: string = 'queryplan-component';

@Component({
	selector: QUERYPLAN_SELECTOR,
	template: ''
})
export class QueryPlanComponent implements OnDestroy, OnInit {

	private _planXml: string;
	private _disposables: Array<IDisposable> = [];

	constructor(
		@Inject(forwardRef(() => ElementRef)) private _el: ElementRef,
		@Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) { }

	ngOnDestroy() {
		dispose(this._disposables);
	}

	ngOnInit() {
		let parameters: QueryPlanParams = this._bootstrapService.getBootstrapParams(this._el.nativeElement.tagName);
		if (parameters) {
			this.planXml = parameters.planXml;
		}
		this._disposables.push(registerThemingParticipant(this._updateTheme));
	}

	public set planXml(val: string) {
		this._planXml = val;
		QP.showPlan(this._el.nativeElement, this._planXml, {
			jsTooltips: false
		});
	}

	private _updateTheme(theme: ITheme, collector: ICssStyleCollector) {
		let backgroundColor = theme.getColor(colors.editorBackground);
		let foregroundColor = theme.getColor(colors.editorForeground);

		if (backgroundColor) {
			collector.addRule(`div.qp-node, .qp-tt, .qp-root { background-color: ${backgroundColor} }`);
		}

		if (foregroundColor) {
			collector.addRule(`.qp-root { color: ${foregroundColor} }`);
		}
	}
}
