/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/media/primeng';
import 'vs/css!sql/parts/grid/load/css/qp';

import { ElementRef, Component, Inject, forwardRef } from '@angular/core';
import { PlanXmlParser, PlanNode } from 'sql/parts/queryPlan/planXmlParser';
import { localize } from 'vs/nls';

export const TOP_OPERATIONS_SELECTOR: string = 'top-operations-component';

@Component({
	selector: TOP_OPERATIONS_SELECTOR,
	templateUrl: require.toUrl('sql/parts/queryPlan/topOperations.component.html'),
	styleUrls: [
		require.toUrl('sql/grid/load/css/qp.css'),
		require.toUrl('sql/media/primeng.css')]
})
export class TopOperationsComponent {

	protected operations: Array<PlanNode> = [];

	constructor(
		@Inject(forwardRef(() => ElementRef)) private _el: ElementRef,
	) {
	}

	 // tslint:disable:no-unused-variable
	private readonly operationLabel: string = localize('topOperations.operation', 'Operation');
	private readonly objectLabel: string = localize('topOperations.object', 'Object');
	private readonly estCostLabel: string = localize('topOperations.estCost', 'Est Cost');
	private readonly estSubtreeCostLabel: string = localize('topOperations.estSubtreeCost', 'Est Subtree Cost');
	private readonly actualRowsLabel: string = localize('topOperations.actualRows', 'Actual Rows');
	private readonly estRowsLabel: string = localize('topOperations.estRows', 'Est Rows');
	private readonly actualExecutionsLabel: string = localize('topOperations.actualExecutions', 'Actual Executions');
	private readonly estCPUCostLabel: string = localize('topOperations.estCPUCost', 'Est CPU Cost');
	private readonly estIOCostLabel: string = localize('topOperations.estIOCost', 'Est IO Cost');
	private readonly parallelLabel: string = localize('topOperations.parallel', 'Parallel');
	private readonly actualRebindsLabel: string = localize('topOperations.actualRebinds', 'Actual Rebinds');
	private readonly estRebindsLabel: string = localize('topOperations.estRebinds', 'Est Rebinds');
	private readonly actualRewindsLabel: string = localize('topOperations.actualRewinds', 'Actual Rewinds');
	private readonly estRewindsLabel: string = localize('topOperations.estRewinds', 'Est Rewinds');
	private readonly partitionedLabel: string = localize('topOperations.partitioned', 'Partitioned');
	// tslint:enable:no-unused-variable

	public set planXml(val: string) {
		let parser: PlanXmlParser = new PlanXmlParser(val);
		this.operations = parser.topOperations;
	}
}
