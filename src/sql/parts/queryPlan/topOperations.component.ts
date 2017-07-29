/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';
import 'vs/css!sql/parts/grid/load/css/qp';

import { ElementRef, Component, Inject, forwardRef } from '@angular/core';
import { PlanXmlParser, PlanNode } from 'sql/parts/queryPlan/planXmlParser';

export const TOP_OPERATIONS_SELECTOR: string = 'top-operations-component';

@Component({
	selector: TOP_OPERATIONS_SELECTOR,
	templateUrl: require.toUrl('sql/parts/queryPlan/topOperations.component.html'),
	styleUrls: [
		require.toUrl('sql/grid/load/css/qp.css'),
		require.toUrl('sql/parts/dashboard/media/dashboard.css'),
		require.toUrl('sql/media/primeng.css')]
})
export class TopOperationsComponent {

	protected operations: Array<PlanNode> = [];

	constructor(
		@Inject(forwardRef(() => ElementRef)) private _el: ElementRef,
	) {
	}

	public set planXml(val: string) {
		let parser: PlanXmlParser = new PlanXmlParser(val);
		this.operations = parser.topOperations;
	}
}
