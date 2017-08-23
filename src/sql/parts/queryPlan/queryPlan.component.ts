/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/media/primeng';
import 'vs/css!sql/parts/grid/load/css/qp';
import { QueryPlanParams } from 'sql/services/bootstrap/bootstrapParams';

import { ElementRef, Component, Inject, forwardRef } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';

export const QUERYPLAN_SELECTOR: string = 'queryplan-component';

declare let QP;

@Component({
	selector: QUERYPLAN_SELECTOR,
	templateUrl: require.toUrl('sql/parts/queryPlan/queryPlan.component.html'),
	styleUrls: [
		require.toUrl('sql/grid/load/css/qp.css'),
		require.toUrl('sql/media/primeng.css')]
})
export class QueryPlanComponent {

	private _planXml: string;

	constructor(
			@Inject(forwardRef(() => ElementRef)) private _el: ElementRef,
			@Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
		) {
			let parameters: QueryPlanParams = this._bootstrapService.getBootstrapParams(this._el.nativeElement.tagName);
			if (parameters)
			{
				this.planXml = parameters.planXml;
			}
		}


	public set planXml(val: string) {
		this._planXml = val;
		QP.showPlan(this._el.nativeElement, this._planXml, {
			jsTooltips: false
		});
	}
}
