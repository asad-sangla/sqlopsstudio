/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import 'vs/css!sql/parts/grid/views/query/chartViewer';

import {
	Component, Inject, ViewContainerRef, forwardRef, OnInit,
	ComponentFactoryResolver, ViewChild, OnDestroy, Input, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { NgGridItemConfig } from 'angular2-grid';

import { Checkbox } from 'sql/base/browser/ui/checkbox/checkbox';
import { ComponentHostDirective } from 'sql/parts/dashboard/common/componentHost.directive';
import { IGridDataSet } from 'sql/parts/grid/common/interfaces';
import * as DialogHelper from 'sql/parts/common/modal/dialogHelper';
import { SelectBox } from 'sql/base/browser/ui/selectBox/selectBox';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { IInsightData, IInsightsView, IInsightsConfig } from 'sql/parts/dashboard/widgets/insights/interfaces';
import { Extensions, IInsightRegistry } from 'sql/platform/dashboard/common/insightRegistry';
import { QueryEditor } from 'sql/parts/query/editor/queryEditor';
import { DataType, ILineConfig } from 'sql/parts/dashboard/widgets/insights/views/charts/types/lineChart.component';
import { PathUtilities } from 'sql/common/pathUtilities';
import * as Utils from 'sql/parts/connection/common/utils';

/* Insights */
import {
	ChartInsight, DataDirection, LegendPosition
} from 'sql/parts/dashboard/widgets/insights/views/charts/chartInsight.component';

import { IDisposable } from 'vs/base/common/lifecycle';
import { Builder } from 'vs/base/browser/builder';
import { attachButtonStyler, attachSelectBoxStyler, attachCheckboxStyler } from 'vs/platform/theme/common/styler';
import { Button } from 'vs/base/browser/ui/button/button';
import { EventType } from 'vs/base/browser/dom';
import Severity from 'vs/base/common/severity';
import URI from 'vs/base/common/uri';
import * as nls from 'vs/nls';
import { Registry } from 'vs/platform/registry/common/platform';
import { mixin } from 'vs/base/common/objects';
import paths = require('vs/base/common/paths');

import path = require('path');
import fs = require('fs');

const insightRegistry = Registry.as<IInsightRegistry>(Extensions.InsightContribution);

@Component({
	selector: 'chart-viewer',
	templateUrl: require.toUrl('sql/parts/grid/views/query/chartViewer.component.html')
})
export class ChartViewerComponent implements OnInit, OnDestroy {
	public legendOptions: string[];
	private chartTypesSelectBox: SelectBox;
	private legendSelectBox: SelectBox;
	private labelFirstColumnCheckBox: Checkbox;
	private columnsAsLabelsCheckBox: Checkbox;
	private createInsightButton: Button;
	private saveChartButton: Button;
	private copyChartButton: Button;

	/* UI */
	/* tslint:disable:no-unused-variable */
	private chartTypeLabel: string = nls.localize('chartTypeLabel', 'Chart Type');
	private dataDirectionLabel: string = nls.localize('dataDirectionLabel', 'Data Direction');
	private verticalLabel: string = nls.localize('verticalLabel', 'Vertical');
	private horizontalLabel: string = nls.localize('horizontalLabel', 'Horizontal');
	private dataTypeLabel: string = nls.localize('dataTypeLabel', 'Data Type');
	private numberLabel: string = nls.localize('numberLabel', 'Number');
	private pointLabel: string = nls.localize('pointLabel', 'Point');
	private labelFirstColumnLabel: string = nls.localize('labelFirstColumnLabel', 'Use First Column as row label?');
	private columnsAsLabelsLabel: string = nls.localize('columnsAsLabelsLabel', 'Use Column names as labels?');
	private legendLabel: string = nls.localize('legendLabel', 'Legend Position');
	private createInsightLabel: string = nls.localize('createInsightLabel', 'Create Dashboard Insight');
	private saveChartLabel: string = nls.localize('saveChartLabel', 'Save As Image');
	private copyChartLabel: string = nls.localize('copyChartLabel', 'Copy Image');
	private chartNotFoundError: string = nls.localize('chartNotFound', 'Could not find chart to save');
	/* tslint:enable:no-unused-variable */

	private _chartConfig: ILineConfig;
	private _disposables: Array<IDisposable> = [];
	private _dataSet: IGridDataSet;
	private _executeResult: IInsightData;
	private _chartComponent: ChartInsight;

	@ViewChild(ComponentHostDirective) private componentHost: ComponentHostDirective;
	@ViewChild('chartTypesContainer', { read: ElementRef }) private chartTypesElement;
	@ViewChild('legendContainer', { read: ElementRef }) private legendElement;
	@ViewChild('labelFirstColumnContainer', { read: ElementRef }) private labelFirstColumnElement;
	@ViewChild('columnsAsLabelsContainer', { read: ElementRef }) private columnsAsLabelsElement;
	@ViewChild('createInsightButtonContainer', { read: ElementRef }) private createInsightButtonElement;
	@ViewChild('saveChartButtonContainer', { read: ElementRef }) private saveChartButtonElement;
	@ViewChild('copyChartButtonContainer', { read: ElementRef }) private copyChartButtonElement;

	constructor(
		@Inject(forwardRef(() => ComponentFactoryResolver)) private _componentFactoryResolver: ComponentFactoryResolver,
		@Inject(forwardRef(() => ViewContainerRef)) private _viewContainerRef: ViewContainerRef,
		@Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _cd: ChangeDetectorRef
	) {
	}

	ngOnInit() {
		this._chartConfig = <ILineConfig>{
			dataDirection: 'vertical',
			dataType: 'number',
			legendPosition: 'none',
			labelFirstColumn: false
		};
		this.legendOptions = Object.values(LegendPosition);
		this.initializeUI();
	}

	private initializeUI() {
		// Init chart type dropdown
		this.chartTypesSelectBox = new SelectBox(insightRegistry.getAllIds(), 'horizontalBar');
		this.chartTypesSelectBox.render(this.chartTypesElement.nativeElement);
		this.chartTypesSelectBox.onDidSelect(selected => this.onChartChanged());
		this._disposables.push(attachSelectBoxStyler(this.chartTypesSelectBox, this._bootstrapService.themeService));

		// Init label first column checkbox
		// Note: must use 'self' for callback
		this.labelFirstColumnCheckBox = DialogHelper.createCheckBox(new Builder(this.labelFirstColumnElement.nativeElement),
			this.labelFirstColumnLabel, 'chartView-checkbox', false, () => this.onLabelFirstColumnChanged());
		this._disposables.push(attachCheckboxStyler(this.labelFirstColumnCheckBox, this._bootstrapService.themeService));

		// Init label first column checkbox
		// Note: must use 'self' for callback
		this.columnsAsLabelsCheckBox = DialogHelper.createCheckBox(new Builder(this.columnsAsLabelsElement.nativeElement),
			this.columnsAsLabelsLabel, 'chartView-checkbox', false, () => this.columnsAsLabelsChanged());
		this._disposables.push(attachCheckboxStyler(this.columnsAsLabelsCheckBox, this._bootstrapService.themeService));

		// Init legend dropdown
		this.legendSelectBox = new SelectBox(this.legendOptions, this._chartConfig.legendPosition);
		this.legendSelectBox.render(this.legendElement.nativeElement);
		this.legendSelectBox.onDidSelect(selected => this.onLegendChanged());
		this._disposables.push(attachSelectBoxStyler(this.legendSelectBox, this._bootstrapService.themeService));

		// create insight button
		this.createInsightButton = new Button(this.createInsightButtonElement.nativeElement, {});
		this.createInsightButton.label = this.createInsightLabel;
		this._disposables.push(this.createInsightButton.addListener(EventType.CLICK, () => this.onCreateInsight()));
		this._disposables.push(attachButtonStyler(this.createInsightButton, this._bootstrapService.themeService));

		// save as image button
		this.saveChartButton = new Button(this.saveChartButtonElement.nativeElement, {});
		this.saveChartButton.label = this.saveChartLabel;
		this._disposables.push(this.saveChartButton.addListener(EventType.CLICK, () => this.onSaveChart()));
		this._disposables.push(attachButtonStyler(this.saveChartButton, this._bootstrapService.themeService));

		// copy image button
		this.copyChartButton = new Button(this.copyChartButtonElement.nativeElement, {});
		this.copyChartButton.label = this.copyChartLabel;
		this._disposables.push(this.copyChartButton.addListener(EventType.CLICK, () => this.onCopyChart()));
		this._disposables.push(attachButtonStyler(this.copyChartButton, this._bootstrapService.themeService));

	}

	public onChartChanged(): void {
		if (['scatter', 'timeSeries'].some(item => item === this.chartTypesSelectBox.value)) {
			this.dataType = DataType.Point;
			this.dataDirection = DataDirection.Horizontal;
		}
		this.initChart();
	}

	public onLabelFirstColumnChanged(): void {
		this._chartConfig.labelFirstColumn = this.labelFirstColumnCheckBox.checked;
		this.initChart();
	}

	public columnsAsLabelsChanged(): void {
		this._chartConfig.columnsAsLabels = this.labelFirstColumnCheckBox.checked;
		this.initChart();
	}

	public onLegendChanged(): void {
		this._chartConfig.legendPosition = <LegendPosition>this.legendSelectBox.value;
		this.initChart();
	}

	public set dataType(type: DataType) {
		this._chartConfig.dataType = type;
		// Requires full chart refresh
		this.initChart();
	}

	public set dataDirection(direction: DataDirection) {
		this._chartConfig.dataDirection = direction;
		// Requires full chart refresh
		this.initChart();
	}

	public onCopyChart(): void {
		let data = this._chartComponent.getCanvasData('jpeg');
		if (!data) {
			this.showError(this.chartNotFoundError);
			return;
		}

		this._bootstrapService.sqlWindowService.writeImageFromDataUrl(data);
	}

	public onSaveChart(): void {
		let filePath = this.promptForFilepath();
		let format = paths.extname(filePath);
		let self = this;
		let data = this._chartComponent.getCanvasData(format);
		if (!data) {
			this.showError(this.chartNotFoundError);
			return;
		}
		if (!Utils.isEmpty(filePath)) {
			let buffer = self.decodeBase64Image(data);
			fs.writeFile(filePath, buffer, (err) => {
				if (err) {
					self.showError(err.message);
				} else {
					let fileUri = URI.from({ scheme: PathUtilities.FILE_SCHEMA, path: filePath });
					self._bootstrapService.windowsService.openExternal(fileUri.toString());
					self._bootstrapService.messageService.show(Severity.Info, nls.localize('chartSaved', 'Saved Chart to path: {0}', filePath));
				}
			});
		}
	}

    private promptForFilepath(): string {
        let filepathPlaceHolder = PathUtilities.resolveCurrentDirectory(this.getActiveUriString(), PathUtilities.getRootPath(this._bootstrapService.workspaceContextService));
        filepathPlaceHolder = path.join(filepathPlaceHolder, 'Chart.jpeg');

        let filePath: string = this._bootstrapService.sqlWindowService.showSaveDialog({
            title: nls.localize('saveAsFileTitle', 'Choose Results File'),
            defaultPath: paths.normalize(filepathPlaceHolder, true)
        });
        return filePath;
	}

	private decodeBase64Image(data: string): Buffer {
		let matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
		return new Buffer(matches[2], 'base64');
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
		let queryFile: string = uri.fsPath;
		let query: string = undefined;
		let type = {};
		type[this.chartTypesSelectBox.value] = this._chartConfig;

		// create JSON
		let config: IInsightsConfig = {
			type,
			query,
			queryFile
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

	private get showDataDirection(): boolean {
		return ['pie', 'horizontalBar', 'bar', 'doughnut'].some(item => item === this.chartTypesSelectBox.value) || (this.chartTypesSelectBox.value === 'line' && this.dataType === 'number');
	}

	private get showLabelFirstColumn(): boolean {
		return this.dataDirection === 'horizontal' && this.dataType !== 'point';
	}

	private get showColumnsAsLabels(): boolean {
		return this.dataDirection === 'vertical' && this.dataType !== 'point';
	}

	private get showDataType(): boolean {
		return this.chartTypesSelectBox.value === 'line';
	}

	public get dataDirection(): DataDirection {
		return this._chartConfig.dataDirection;
	}

	public get dataType(): DataType {
		return this._chartConfig.dataType;
	}

	@Input() set dataSet(dataSet: IGridDataSet) {
		// Setup the execute result
		this._dataSet = dataSet;
		this._executeResult = <IInsightData>{};
		this._executeResult.columns = dataSet.columnDefinitions.map(def => def.name);
		this._executeResult.rows = dataSet.dataRows.getRange(0, dataSet.dataRows.getLength()).map(gridRow => {
			return gridRow.values.map(cell => cell.displayValue);
		});
		this.initChart();
	}

	public initChart() {
		this._cd.detectChanges();
		if (this._executeResult) {
			// Reinitialize the chart component
			let componentFactory = this._componentFactoryResolver.resolveComponentFactory<IInsightsView>(insightRegistry.getCtorFromId(this.chartTypesSelectBox.value));
			this.componentHost.viewContainerRef.clear();
			let componentRef = this.componentHost.viewContainerRef.createComponent(componentFactory);
			this._chartComponent = <ChartInsight>componentRef.instance;
			this._chartComponent.config = this._chartConfig;
			this._chartComponent.data = this._executeResult;
			this._chartComponent.options = mixin(this._chartComponent.options, { animation: { duration: 0 } });
			if (this._chartComponent.init) {
				this._chartComponent.init();
			}
		}
	}

	ngOnDestroy() {
		this._disposables.forEach(i => i.dispose());
	}
}