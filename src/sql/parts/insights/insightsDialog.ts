/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IQueryManagementService } from 'sql/parts/query/common/queryManagement';
import QueryRunner from 'sql/parts/query/execution/queryRunner';
import { IConnectionManagementService, IErrorMessageService } from 'sql/parts/connection/common/connectionManagement';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import * as Utils from 'sql/parts/connection/common/utils';
import { Modal } from 'sql/parts/common/modal/modal';
import { InsightsConfig } from 'sql/parts/dashboard/widgets/insights/insightsWidget.component';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { $ } from 'vs/base/browser/builder';

import { DbCellValue, IDbColumn, IResultMessage } from 'data';

import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import * as DOM from 'vs/base/browser/dom';
import { SplitView, CollapsibleState, CollapsibleView } from 'vs/base/browser/ui/splitview/splitview';
import { List } from 'vs/base/browser/ui/list/listWidget';
import { IDelegate, IRenderer, IListEvent } from 'vs/base/browser/ui/list/list';
import { IDisposable } from 'vs/base/common/lifecycle';
import { attachListStyler } from 'vs/platform/theme/common/styler';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IListService } from 'vs/platform/list/browser/listService';
import Severity from 'vs/base/common/severity';
import * as nls from 'vs/nls';

class BasicView extends CollapsibleView {
	constructor(private viewTitle: string, private list: List<any>, private _bodyContainer: HTMLElement, collapsed: boolean, headerSize: number) {
		super({
			headerSize: headerSize,
			initialState: collapsed ? CollapsibleState.COLLAPSED : CollapsibleState.EXPANDED,
			ariaHeaderLabel: viewTitle
		});
	}

	public renderHeader(container: HTMLElement): void {
		const titleDiv = $('div.title').appendTo(container);
		$('span').text(this.viewTitle).appendTo(titleDiv);
	}

	public renderBody(container: HTMLElement): void {
		container.appendChild(this._bodyContainer);
	}

	public layoutBody(size: number): void {
		this._bodyContainer.style.height = size + 'px';
		this.list.layout(size);
	}
}

class Delegate implements IDelegate<string[] | BottomListResource> {
	getHeight() { return 22; };

	getTemplateId(element: string[] | BottomListResource) {
		return 'string';
	}
}

interface TableTemplate {
	label: HTMLElement;
	value: HTMLElement;
}

class TopRenderer implements IRenderer<string[], TableTemplate> {
	static TEMPLATE_ID = 'string';
	get templateId(): string { return TopRenderer.TEMPLATE_ID; }
	public labelIndex: number;
	public valueIndex: number;

	renderTemplate(container: HTMLElement): TableTemplate {
		const label = DOM.$('span.label');
		label.style.fontWeight = 'bold';
		label.style.paddingRight = '20px';
		const value = DOM.$('span.value');
		DOM.append(container, label);
		DOM.append(container, value);

		return { label, value };
	}

	renderElement(resource: string[], index: number, template: TableTemplate): void {
		template.label.innerHTML = resource[this.labelIndex];
		template.value.innerHTML = resource[this.valueIndex];
	}

	disposeTemplate(template: TableTemplate): void {
		// noop
	}
}

interface BottomListResource {
	value: string;
	label: string;
}

class BottomRender implements IRenderer<BottomListResource, TableTemplate> {
	static TEMPLATE_ID = 'string';
	get templateId(): string { return BottomRender.TEMPLATE_ID; }

	renderTemplate(container: HTMLElement): TableTemplate {
		const label = DOM.$('span.label');
		label.style.fontWeight = 'bold';
		label.style.paddingRight = '20px';
		const value = DOM.$('span.value');
		DOM.append(container, label);
		DOM.append(container, value);

		return { label, value };
	}

	renderElement(resource: BottomListResource, index: number, template: TableTemplate): void {
		template.label.innerHTML = resource.label;
		template.value.innerHTML = resource.value;
	}

	disposeTemplate(template: TableTemplate): void {
		// noop
	}
}

export default class InsightsDialog extends Modal {
	private _queryRunner: QueryRunner;
	private _connectionProfile: IConnectionProfile;
	private _connectionUri: string;
	private _rows: DbCellValue[][];
	private _columns: IDbColumn[];
	private _insight: InsightsConfig;
	private _disposables: IDisposable[] = [];
	private _topList: List<any>;
	private _bottomList: List<any>;
	private _topRenderer: TopRenderer;
	private _splitView: SplitView;
	private _container: HTMLElement;

	constructor(
		@IQueryManagementService private queryManagementService: IQueryManagementService,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IThemeService private _themeService: IThemeService,
		@IListService private _listService: IListService,
		@IPartService _partService: IPartService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService,
	) {
		super('Insights', _partService);
	}

	protected renderBody(container: HTMLElement) {
		this._container = container;
		const delegate = new Delegate();
		this._topRenderer = new TopRenderer();
		let bottomRenderer = new BottomRender();
		let topViewBody = $().div();
		let bottomViewBody = $().div();

		this._splitView = new SplitView(container);

		this._bottomList = new List<BottomListResource>(bottomViewBody.getHTMLElement(), delegate, [bottomRenderer]);

		this._topList = new List<string[]>(topViewBody.getHTMLElement(), delegate, [this._topRenderer]);

		this._disposables.push(this._topList.onSelectionChange((e: IListEvent<any>) => {
			if (e.elements.length === 1) {
				let resourceArray: BottomListResource[] = [];
				for (let i = 0; i < this._columns.length; i++) {
					resourceArray.push({ label: this._columns[i].columnName, value: e.elements[0][i] });
				}
				this._bottomList.splice(0, this._bottomList.length, resourceArray);
			}
		}));

		let topview = new BasicView('Data', this._topList, topViewBody.getHTMLElement(), false, 22);
		let bottomview = new BasicView('Data', this._bottomList, bottomViewBody.getHTMLElement(), false, 22);
		this._splitView.addView(topview);
		this._splitView.addView(bottomview);


		this._disposables.push(attachListStyler(this._topList, this._themeService));
		this._disposables.push(this._listService.register(this._topList));
		this._disposables.push(attachListStyler(this._bottomList, this._themeService));
		this._disposables.push(this._listService.register(this._bottomList));

		this._topList.splice(0, this._topList.length);
		this._bottomList.splice(0, this._bottomList.length);
	}

	public render() {
		super.render();
		this.addFooterButton('Close', () => this.close());
		this._disposables.push(attachModalDialogStyler(this, this._themeService));
	}

	// query string
	public open(input: InsightsConfig, connectionProfile: IConnectionProfile): void;
	// query results
	// public show(input: SimpleExecuteResult);
	// insight object
	public open(input?: any, connectionProfile?: IConnectionProfile): void {
		// execute string
		if (typeof input === 'object') {
			this._insight = input;
			this.createQuery(this._insight.detailsQuery, connectionProfile);
			this._topList.splice(0, this._topList.length);
			this._bottomList.splice(0, this._bottomList.length);
			this.show();
		}
	}

	//tslint:disable-next-line
	private async createQuery(queryString: string, connectionProfile: IConnectionProfile): Promise<void> {
		let self = this;
		if (this._queryRunner) {
			if (!this._queryRunner.hasCompleted) {
				await this._queryRunner.cancelQuery();
			}
			await this.createNewConnection(connectionProfile);
			this._queryRunner.uri = this._connectionUri;
		} else {
			await this.createNewConnection(connectionProfile);
			this._queryRunner = self._instantiationService.createInstance(QueryRunner, this._connectionUri, undefined);
			this.addQueryEventListeners(this._queryRunner);
		}

		this._queryRunner.runQuery(queryString);
	}

	private addQueryEventListeners(queryRunner: QueryRunner): void {
		queryRunner.eventEmitter.on('complete', (resultSet) => {
			this.queryComplete();
		});
		queryRunner.eventEmitter.on('message', (message: IResultMessage) => {
			if (message.isError) {
				this._errorMessageService.showDialog(this._container, Severity.Error, nls.localize('insightsError', 'Insights Error'), message.message);
			}
		});
	}

	//tslint:disable-next-line
	private async queryComplete(): Promise<void> {
		let batchs = this._queryRunner.batchSets;
		// currently only support 1 batch set 1 resultset
		if (batchs.length > 0) {
			let batch = batchs[0];
			if (batch.resultSetSummaries.length > 0) {
				let resultset = batch.resultSetSummaries[0];
				this._columns = resultset.columnInfo;
				let rows = await this._queryRunner.getQueryRows(0, resultset.rowCount - 1, batch.id, resultset.id);
				this._rows = rows.resultSubset.rows;
				this.build();
			}
		}
	}

	private build(): void {
		let elements = this._rows;
		let labelIndex: number;
		let valueIndex: number;
		if (this._insight.label === undefined || (labelIndex = this.findIndex(this._insight.label, this._columns)) === -1) {
			labelIndex = 0;
		}
		if (this._insight.value === undefined || (valueIndex = this.findIndex(this._insight.value, this._columns)) === -1) {
			valueIndex = 1;
		}
		this._topRenderer.labelIndex = labelIndex;
		this._topRenderer.valueIndex = valueIndex;
		// convert
		let inputArray = elements.map((item) => {
			return item.map((item2) => {
				return item2.displayValue;
			});
		});
		this._topList.splice(0, this._topList.length, inputArray);
		this._splitView.layout(DOM.getContentHeight(this._container));
	}

	private findIndex(val: string, row: DbCellValue[]): number;
	private findIndex(val: string, row: IDbColumn[]): number;
	private findIndex(val: string, row: Object[]): number {
		if (row.length <= 0) {
			return -1;
		}

		let property: string;
		if (row[0]['columnName']) {
			property = 'columnName';
		} else {
			property = 'displayValue';
		}
		for (let i = 0; i <= row.length; i++) {
			if (row[i][property] === val) {
				return i;
			}
		}
		return -1;
	}

	//tslint:disable-next-line
	private async createNewConnection(connectionProfile: IConnectionProfile): Promise<void> {
		// determine if we need to create a new connection
		if (!this._connectionProfile || connectionProfile.getOptionsKey() !== this._connectionProfile.getOptionsKey()) {
			if (this._connectionProfile) {
				await this.connectionManagementService.disconnect(this._connectionUri);
			}
			this._connectionProfile = connectionProfile;
			this._connectionUri = Utils.generateUri(this._connectionProfile, 'insights');
			await this.connectionManagementService.connect(this._connectionProfile, this._connectionUri);
		}
	}

	public close() {
		this.hide();
	}
}