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
import { NgGridItemConfig } from 'angular2-grid';

import { ComponentHostDirective } from 'sql/parts/dashboard/common/componentHost.directive';
import { IGridDataSet } from 'sql/parts/grid/common/interfaces';
import * as DialogHelper from 'sql/parts/common/modal/dialogHelper';
import { DialogSelectBox } from 'sql/parts/common/modal/dialogSelectBox';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { QueryEditor } from 'sql/parts/query/editor/queryEditor';


/* Insights */
import {
	ChartInsight, IChartConfig, DataDirection, ChartType, LegendPosition,
	IExecuteResult, ICellValue, IColumn, validChartTypes, validLegendPositions
} from 'sql/parts/dashboard/widgets/insights/views/chartInsight.component';
import { IInsightsConfig } from 'sql/parts/dashboard/widgets/insights/interfaces';
import { SimpleExecuteResult } from 'data';

import { IDisposable } from 'vs/base/common/lifecycle';
import { Checkbox } from 'vs/base/browser/ui/checkbox/checkbox';
import { Builder } from 'vs/base/browser/builder';
import { attachButtonStyler, attachSelectBoxStyler, attachCheckboxStyler } from 'vs/platform/theme/common/styler';
import { Button } from 'vs/base/browser/ui/button/button';
import Severity from 'vs/base/common/severity';
import URI from 'vs/base/common/uri';
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
	public createInsightLabel: string = nls.localize('createInsightLabel', 'Create Dashboard Insight');
	public chartTypeOptions: string[];
	public legendOptions: string[];
	private chartTypesSelectBox: DialogSelectBox;
	private legendSelectBox: DialogSelectBox;
	private labelFirstColumnCheckBox: Checkbox;
	private createInsightButton: Button;

	private _chartConfig: IChartConfig;
	private _disposables: Array<IDisposable> = [];
	private _dataSet: IGridDataSet;
	private _executeResult: IExecuteResult;
	private _chartComponent: ChartInsight;

	@ViewChild(ComponentHostDirective) private componentHost: ComponentHostDirective;
	@ViewChild('chartTypesContainer', { read: ElementRef }) chartTypesElement;
	@ViewChild('legendContainer', { read: ElementRef }) legendElement;
	@ViewChild('labelFirstColumnContainer', { read: ElementRef }) labelFirstColumnElement;
	@ViewChild('createInsightButtonContainer', { read: ElementRef }) createInsightButtonElement;

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
			dataType: 'number',
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

		// create insight button
		this.createInsightButton = new Button(this.createInsightButtonElement.nativeElement, {});
		this.createInsightButton.label = this.createInsightLabel;
		this._disposables.push(this.createInsightButton.addListener('click', () => this.onCreateInsight()));
		this._disposables.push(attachButtonStyler(this.createInsightButton, this._bootstrapService.themeService));

	}

	public onChartChanged(): void {
		this._chartConfig.chartType = <ChartType>this.chartTypesSelectBox.value;
		if (['timeSeries', 'scatter'].indexOf(this._chartConfig.chartType) > -1) {
			this._chartConfig.dataType = 'point';
		} else {
			// TODO gracefully handle choice at this point
			this._chartConfig.dataType = 'number';
		}
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

	public onCreateInsight(): void {
		let uriString: string = this.getActiveUriString();
		if (!uriString) {
			this.showError(nls.localize('createInsightNoEditor', 'Cannot create insight as the active editor is not a SQL Editor'));
			return;
		}

		let uri: URI = URI.parse(uriString);
		let dataService = this._bootstrapService.queryModelService.getDataService(uriString);
		if (!dataService) {
			this.showError(nls.localize('createInsightNoDataService', 'Cannot create insight, backing data model not found'));
			return;
		}
		let queryFilePath: string = uri.fsPath;
		let queryText: string = undefined;

		// create JSON
		let config: IInsightsConfig = {
			type: {
				'chart': this._chartConfig
			},
			query: queryText,
			queryFile: queryFilePath
		};

		let widgetConfig = {
			name: nls.localize('myWidgetName', 'My-Widget'),
			gridItemConfig: this.getGridItemConfig(),
			widget: {
				'insights-widget': config
			}
		};

		// open in new window as untitled JSON file
		dataService.openLink(JSON.stringify(widgetConfig), 'Insight', 'json');
	}

	private showError(errorMsg: string) {
		this._bootstrapService.messageService.show(Severity.Error, errorMsg);
	}

	private getGridItemConfig(): NgGridItemConfig {
		let config: NgGridItemConfig = {
			sizex: 2,
			sizey: 1
		};
		let isSquare = ['pie', 'doughnut'].indexOf(this._chartConfig.chartType) > -1;
		if (isSquare) {
			config.sizex = 1;
		}
		return config;
	}

	private getActiveUriString(): string {
		let editorService = this._bootstrapService.editorService;
		let editor = editorService.getActiveEditor();
		if (editor && editor instanceof QueryEditor) {
			let queryEditor: QueryEditor = editor;
			return queryEditor.uri;
		}
		return undefined;
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
			this._chartComponent.dataType = this._chartConfig.dataType;
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