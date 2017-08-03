/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import 'vs/css!sql/media/icons/common-icons';
import 'vs/css!sql/parts/grid/views/query/chartViewer';

import {
	Component, Inject, ViewContainerRef, forwardRef, OnInit,
	ComponentFactoryResolver, ViewChild, OnDestroy, Input, ElementRef
} from '@angular/core';

import { ComponentHostDirective } from 'sql/parts/dashboard/common/componentHost.directive';
import { IGridDataSet } from 'sql/parts/grid/common/interfaces';
import * as DialogHelper from 'sql/parts/common/modal/dialogHelper';
import { DialogSelectBox } from 'sql/parts/common/modal/dialogSelectBox';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { attachSelectBoxStyler, attachCheckboxStyler } from 'vs/platform/theme/common/styler';

/* Insights */
import {
	ChartInsight, IChartConfig, DataDirection, ChartType, LegendPosition,
	IExecuteResult, ICellValue, IColumn, validChartTypes, validLegendPositions
} from 'sql/parts/dashboard/widgets/insights/views/chartInsight.component';

import { SimpleExecuteResult } from 'data';

import { IDisposable } from 'vs/base/common/lifecycle';
import { Checkbox } from 'vs/base/browser/ui/checkbox/checkbox';
import { Builder, $ } from 'vs/base/browser/builder';
import * as nls from 'vs/nls';

export interface IInsightsView {
	data: SimpleExecuteResult;
	customFields: Array<string>;
	ngOnInit?: () => void;
}

@Component({
	selector: 'chart-viewer',
	templateUrl: require.toUrl('sql/parts/grid/views/query/chartViewer.component.html')
})
export class ChartViewerComponent implements OnInit, OnDestroy {
	public chartTypeLabel: string = nls.localize('chartTypeLabel', 'Chart Type');
	public dataDirectionLabel: string = nls.localize('dataDirectionLabel', 'Data Direction');
	public verticalLabel: string = nls.localize('verticalLabel', 'Vertical');
	public horizontalLabel: string = nls.localize('horizontalLabel', 'Horizontal');
	public labelFirstColumnLabel: string = nls.localize('labelFirstColumnLabel', 'Use First Column as row label?');
	public legendLabel: string = nls.localize('legendLabel', 'Legend Position');
	public chartTypeOptions: string[];
	public legendOptions: string[];
	private chartTypesSelectBox: DialogSelectBox;
	private legendSelectBox: DialogSelectBox;
	private labelFirstColumnCheckBox: Checkbox;

	private _chartConfig: IChartConfig;
	private _disposables: Array<IDisposable> = [];
	private _dataSet: IGridDataSet;
	private _executeResult: IExecuteResult;
	private _chartComponent: ChartInsight;

	@ViewChild(ComponentHostDirective) private componentHost: ComponentHostDirective;
	@ViewChild('chartTypesContainer', { read: ElementRef }) chartTypesElement;
	@ViewChild('legendContainer', { read: ElementRef }) legendElement;
	@ViewChild('labelFirstColumnContainer', { read: ElementRef }) labelFirstColumnElement;

	constructor(
		@Inject(forwardRef(() => ComponentFactoryResolver)) private _componentFactoryResolver: ComponentFactoryResolver,
		@Inject(forwardRef(() => ViewContainerRef)) private _viewContainerRef: ViewContainerRef,
		@Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService,
	) {
	}

	ngOnInit() {
		this._chartConfig = <IChartConfig>{
			chartType: 'horizontalBar',
			dataDirection: 'vertical',
			legendPosition: 'none',
			labelFirstColumn: false
		};
		this.chartTypeOptions = validChartTypes;
		this.legendOptions = validLegendPositions;
		this.initializeUI();
	}

	private initializeUI() {
		// Init chart type dropdown
		this.chartTypesSelectBox = new DialogSelectBox(this.chartTypeOptions, this._chartConfig.chartType);
		this.chartTypesSelectBox.render(this.chartTypesElement.nativeElement);
		this.chartTypesSelectBox.onDidSelect(selected => this.onChartChanged());
		this._disposables.push(attachSelectBoxStyler(this.chartTypesSelectBox, this._bootstrapService.themeService));

		// Init label first column checkbox
		// Note: must use 'self' for callback
		this.labelFirstColumnCheckBox = DialogHelper.createCheckBox(new Builder(this.labelFirstColumnElement.nativeElement),
			this.labelFirstColumnLabel, 'sql-checkbox', false, () => this.onLabelFirstColumnChanged());
		this._disposables.push(attachCheckboxStyler(this.labelFirstColumnCheckBox, this._bootstrapService.themeService));

		// Init legend dropdown
		this.legendSelectBox = new DialogSelectBox(this.legendOptions, this._chartConfig.legendPosition);
		this.legendSelectBox.render(this.legendElement.nativeElement);
		this.legendSelectBox.onDidSelect(selected => this.onLegendChanged());
		this._disposables.push(attachSelectBoxStyler(this.legendSelectBox, this._bootstrapService.themeService));
	}

	public onChartChanged(): void {
		this._chartConfig.chartType = <ChartType>this.chartTypesSelectBox.value;
		this.initChart();
	}

	public onLabelFirstColumnChanged(): void {
		this._chartConfig.labelFirstColumn = this.labelFirstColumnCheckBox.checked;
		this.initChart();
	}

	public onLegendChanged(): void {
		this._chartConfig.legendPosition = <LegendPosition>this.legendSelectBox.value;
		this.initChart();
	}

	public get dataDirection(): DataDirection {
		return this._chartConfig.dataDirection;
	}

	public set dataDirection(direction: DataDirection) {
		this._chartConfig.dataDirection = direction;
		// Requires full chart refresh
		this.initChart();
	}

	@Input() set dataSet(dataSet: IGridDataSet) {
		// Setup the execute result
		this._dataSet = dataSet;
		this._executeResult = <IExecuteResult>{};
		this._executeResult.rowCount = dataSet.dataRows.getLength();
		this._executeResult.columnInfo = dataSet.columnDefinitions.map(def => <IColumn>{ columnName: def.name });
		this._executeResult.rows = dataSet.dataRows.getRange(0, dataSet.dataRows.getLength()).map(gridRow => {
			let row: ICellValue[] = gridRow.values;
			return row;
		});
		this.initChart();
	}

	public initChart() {
		if (this._executeResult) {
			// Reinitialize the chart component
			let componentFactory = this._componentFactoryResolver.resolveComponentFactory<IInsightsView>(ChartInsight);
			this.componentHost.viewContainerRef.clear();
			let componentRef = this.componentHost.viewContainerRef.createComponent(componentFactory);
			this._chartComponent = <ChartInsight>componentRef.instance;
			this._chartComponent.chartType = this._chartConfig.chartType;
			this._chartComponent.dataDirection = this._chartConfig.dataDirection;
			this._chartComponent.colorMap = this._chartConfig.colorMap;
			this._chartComponent.labelFirstColumn = this._chartConfig.labelFirstColumn;
			this._chartComponent.legendPosition = this._chartConfig.legendPosition;
			this._chartComponent.data = <SimpleExecuteResult>this._executeResult;
			if (this._chartComponent.init) {
				this._chartComponent.init();
			}
		}
	}

	ngOnDestroy() {
		this._disposables.forEach(i => i.dispose());
	}
}