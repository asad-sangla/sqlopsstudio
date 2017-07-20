/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import 'vs/css!sql/parts/insights/media/insightsDialog';

import { IQueryManagementService } from 'sql/parts/query/common/queryManagement';
import QueryRunner from 'sql/parts/query/execution/queryRunner';
import { IConnectionManagementService, IErrorMessageService } from 'sql/parts/connection/common/connectionManagement';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import * as Utils from 'sql/parts/connection/common/utils';
import { Modal } from 'sql/parts/common/modal/modal';
import { InsightsConfig, IInsightLabel } from 'sql/parts/dashboard/widgets/insights/insightsWidget.component';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { Conditional } from 'sql/parts/dashboard/common/interfaces';
import { ITaskRegistry, Extensions as TaskExtensions } from 'sql/platform/tasks/taskRegistry';
import { ITaskActionContext } from 'sql/workbench/electron-browser/actions';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';

import { DbCellValue, IDbColumn, IResultMessage, QueryExecuteSubsetResult } from 'data';

import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import * as DOM from 'vs/base/browser/dom';
import { SplitView, CollapsibleState, CollapsibleView } from 'vs/base/browser/ui/splitview/splitview';
import { List } from 'vs/base/browser/ui/list/listWidget';
import { IDelegate, IRenderer, IListEvent, IListContextMenuEvent } from 'vs/base/browser/ui/list/list';
import { IDisposable } from 'vs/base/common/lifecycle';
import { attachListStyler, attachButtonStyler } from 'vs/platform/theme/common/styler';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IListService } from 'vs/platform/list/browser/listService';
import Severity from 'vs/base/common/severity';
import * as nls from 'vs/nls';
import * as types from 'vs/base/common/types';
import * as pfs from 'vs/base/node/pfs';
import { IMessageService } from 'vs/platform/message/common/message';
import { $ } from 'vs/base/browser/builder';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { Registry } from 'vs/platform/platform';
import { IAction } from 'vs/base/common/actions';
import { TPromise } from 'vs/base/common/winjs.base';

/* Regex that matches the form `${value}` */
const insertValueRegex: RegExp = /\${(.*?)\}/;

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

class Delegate implements IDelegate<ListResource> {
	getHeight = () => 22;

	getTemplateId(element: ListResource) {
		return 'string';
	}
}

interface TableTemplate {
	label: HTMLElement;
	value: HTMLElement;
	icon: HTMLElement;
	badgeContent: HTMLElement;
}

class TopRenderer implements IRenderer<ListResource, TableTemplate> {
	static TEMPLATE_ID = 'string';
	get templateId(): string { return TopRenderer.TEMPLATE_ID; }

	renderTemplate(container: HTMLElement): TableTemplate {
		const row = DOM.$('div.list-row');
		DOM.append(container, row);
		const icon = DOM.$('span.icon-span');
		const label = DOM.$('span.label');
		const value = DOM.$('span.value');
		const badge = DOM.$('div.badge');
		const badgeContent = DOM.$('div.badge-content');
		DOM.append(badge, badgeContent);
		DOM.append(icon, badge);
		DOM.append(row, icon);
		DOM.append(row, label);
		DOM.append(row, value);

		return { label, value, icon, badgeContent };
	}

	renderElement(resource: ListResource, index: number, template: TableTemplate): void {
		template.label.innerHTML = resource.label;
		template.value.innerHTML = resource.value;
		// render icon if passed
		if (resource.icon) {
			template.icon.classList.add('icon');
			template.icon.classList.add(resource.icon);
		} else {
			template.icon.classList.remove('icon');
		}

		//render state badge if present
		if (resource.stateColor) {
			template.badgeContent.style.backgroundColor = resource.stateColor;
			template.badgeContent.classList.remove('icon');
		} else if (resource.stateIcon) {
			template.badgeContent.style.backgroundColor = '';
			template.badgeContent.classList.add('icon');
			template.badgeContent.classList.add(resource.stateIcon);
		} else {
			template.badgeContent.classList.remove('icon');
			template.badgeContent.style.backgroundColor = '';
		}
	}

	disposeTemplate(template: TableTemplate): void {
		// noop
	}
}

interface ListResource {
	title: boolean;
	value: string;
	label: string;
	icon?: string;
	data?: string[];
	stateColor?: string;
	stateIcon?: string;
}

class BottomRender implements IRenderer<ListResource, TableTemplate> {
	static TEMPLATE_ID = 'string';
	get templateId(): string { return BottomRender.TEMPLATE_ID; }

	renderTemplate(container: HTMLElement): TableTemplate {
		const row = DOM.$('div.list-row');
		DOM.append(container, row);
		const icon = DOM.$('span.icon-span');
		const label = DOM.$('span.label');
		const value = DOM.$('span.value');
		const badge = DOM.$('div.badge');
		const badgeContent = DOM.$('div.badge-content');
		DOM.append(badge, badgeContent);
		DOM.append(icon, badge);
		DOM.append(row, icon);
		DOM.append(row, label);
		DOM.append(row, value);

		return { label, value, icon, badgeContent };
	}

	renderElement(resource: ListResource, index: number, template: TableTemplate): void {
		template.label.innerHTML = resource.label;
		template.value.innerHTML = resource.value;
	}

	disposeTemplate(template: TableTemplate): void {
		// noop
	}
}

export default class InsightsDialog extends Modal {
	private _queryRunner: QueryRunner;
	private _connectionUri: string;
	private _connectionProfile: IConnectionProfile;
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
		@IMessageService private _messageService: IMessageService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService,
		@IContextMenuService private _contextMenuService: IContextMenuService
	) {
		super('Insights', _partService);
	}

	protected renderBody(container: HTMLElement) {
		this._container = container;
		const delegate = new Delegate();
		this._topRenderer = new TopRenderer();
		let bottomRenderer = new BottomRender();
		let topViewBody = $().div({ 'class': 'insights' });
		let bottomViewBody = $().div({ 'class': 'insights' });

		this._splitView = new SplitView(container);

		this._bottomList = new List<ListResource>(bottomViewBody.getHTMLElement(), delegate, [bottomRenderer]);

		this._topList = new List<ListResource>(topViewBody.getHTMLElement(), delegate, [this._topRenderer]);

		this._disposables.push(this._topList.onSelectionChange((e: IListEvent<ListResource>) => {
			if (e.elements.length === 1 && !e.elements[0].title) {
				let resourceArray: ListResource[] = [];
				for (let i = 0; i < this._columns.length; i++) {
					resourceArray.push({ title: false, label: this._columns[i].columnName, value: e.elements[0].data[i] });
				}
				resourceArray.unshift({ title: true, value: nls.localize('value', 'Value').toUpperCase(), label: nls.localize('property', 'Property').toUpperCase() });
				this._bottomList.splice(0, this._bottomList.length, resourceArray);
			}
		}));

		this._disposables.push(this._topList.onContextMenu((e: IListContextMenuEvent<ListResource>) => {
			if (e.element) {
				this._contextMenuService.showContextMenu({
					getAnchor: () => e.anchor,
					getActions: () => this.insightActions,
					getActionsContext: () => this.insightContext(e.element)
				});
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
		let button = this.addFooterButton('Close', () => this.close());
		this._disposables.push(attachButtonStyler(button, this._themeService));
		this._disposables.push(attachModalDialogStyler(this, this._themeService));
	}

	// insight object
	public open(input: InsightsConfig, connectionProfile: IConnectionProfile): void {
		// execute string
		if (typeof input === 'object') {
			if (connectionProfile === undefined) {
				this._messageService.show(Severity.Error, nls.localize('insightsInputError', 'No Connection Profile was passed to insights flyout'));
				return;
			}
			this._insight = input;
			let self = this;
			if (types.isStringArray(this._insight.details.query)) {
				this.createQuery(this._insight.details.query.join(' '), connectionProfile).catch(e => {
					self._errorMessageService.showDialog(Severity.Error, nls.localize('insightsError', 'Insights Error'), e);
				});
			} else if (types.isString(this._insight.details.query)) {
				this.createQuery(this._insight.details.query, connectionProfile).catch(e => {
					self._errorMessageService.showDialog(Severity.Error, nls.localize('insightsError', 'Insights Error'), e);
				});
			} else if (types.isString(this._insight.details.queryFile)) {
				let self = this;
				pfs.readFile(this._insight.details.queryFile).then(
					buffer => {
						self.createQuery(buffer.toString(), connectionProfile).catch(e => {
							self._errorMessageService.showDialog(Severity.Error, nls.localize('insightsError', 'Insights Error'), e);
						});;
						self._topList.splice(0, this._topList.length);
						self._bottomList.splice(0, this._bottomList.length);
						self.show();
					},
					error => {
						self._messageService.show(Severity.Error, nls.localize('insightsFileError', 'There was an error reading the query file: ') + error);
					}
				);
				return;
			} else {
				console.error('Error reading details Query: ', this._insight);
				this._messageService.show(Severity.Error, nls.localize('insightsConfigError', 'There was an error parsing the insight config; could not find query array/string or queryfile'));
				return;
			}
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
			try {
				await this.createNewConnection(connectionProfile);
			} catch (e) {
				return Promise.reject(e);
			}
			this._queryRunner.uri = this._connectionUri;
		} else {
			try {
				await this.createNewConnection(connectionProfile);
			} catch (e) {
				return Promise.reject(e);
			}
			this._queryRunner = self._instantiationService.createInstance(QueryRunner, this._connectionUri, undefined);
			this.addQueryEventListeners(this._queryRunner);
		}

		return this._queryRunner.runQuery(queryString);
	}

	private addQueryEventListeners(queryRunner: QueryRunner): void {
		let self = this;
		queryRunner.eventEmitter.on('complete', () => {
			self.queryComplete().then(undefined, error => {
				self._errorMessageService.showDialog(Severity.Error, nls.localize('insightsError', 'Insights Error'), error);
			});
		});
		queryRunner.eventEmitter.on('message', (message: IResultMessage) => {
			if (message.isError) {
				this._errorMessageService.showDialog(Severity.Error, nls.localize('insightsError', 'Insights Error'), message.message);
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
				let rows: QueryExecuteSubsetResult;
				try {
					rows = await this._queryRunner.getQueryRows(0, resultset.rowCount - 1, batch.id, resultset.id);
				} catch (e) {
					return Promise.reject(e);
				}
				this._rows = rows.resultSubset.rows;
				this.build();
			}
		}
	}

	private build(): void {
		let elements = this._rows;
		let labelIndex: number;
		let valueIndex: number;
		let columnName = typeof this._insight.details.label === 'object' ? this._insight.details.label.column : this._insight.details.label;
		if (this._insight.details.label === undefined || (labelIndex = this.findIndex(columnName, this._columns)) === -1) {
			labelIndex = 0;
		}
		if (this._insight.details.value === undefined || (valueIndex = this.findIndex(this._insight.details.value, this._columns)) === -1) {
			valueIndex = 1;
		}
		// convert
		let inputArray: ListResource[] = elements.map((item) => {
			let label = item[labelIndex].displayValue;
			let value = item[valueIndex].displayValue;
			let state = this.calcInsightState(value);
			let data = item.map((val) => {
				return val.displayValue;
			});
			let icon = typeof this._insight.details.label === 'object' ? this._insight.details.label.icon : undefined;
			let rval = { title: false, label, value, icon, data };
			if (state) {
				rval[state.type] = state.val;
			}
			return rval;
		});
		// add the header onto the front of the array
		inputArray.unshift({ title: true, label: this._columns[labelIndex].columnName.toUpperCase(), value: this._columns[valueIndex].columnName.toUpperCase() });
		this._topList.splice(0, this._topList.length, inputArray);
		this._splitView.layout(DOM.getContentHeight(this._container));
	}

	/**
	 * Calculates the state of the item value passed based on the insight conditions
	 * @param item item to determine state for
	 * @returns json that specifies whether the state is an icon or color and the val of that state
	 */
	private calcInsightState(item: string): { type: 'stateColor' | 'stateIcon', val: string } {
		if (typeof this._insight.details.label === 'string') {
			return undefined;
		} else {
			let label = <IInsightLabel>this._insight.details.label;
			for (let cond of label.state) {
				switch (Conditional[cond.condition.if]) {
					case Conditional.always:
						return cond.color
							? { type: 'stateColor', val: cond.color }
							: { type: 'stateIcon', val: cond.icon };
					case Conditional.equals:
						if (item === cond.condition.equals) {
							return cond.color
								? { type: 'stateColor', val: cond.color }
								: { type: 'stateIcon', val: cond.icon };
						}
						break;
					case Conditional.notEquals:
						if (item !== cond.condition.equals) {
							return cond.color
								? { type: 'stateColor', val: cond.color }
								: { type: 'stateIcon', val: cond.icon };
						}
						break;
					case Conditional.greaterThanOrEquals:
						if (parseInt(item) >= parseInt(cond.condition.equals)) {
							return cond.color
								? { type: 'stateColor', val: cond.color }
								: { type: 'stateIcon', val: cond.icon };
						}
						break;
					case Conditional.greaterThan:
						if (parseInt(item) > parseInt(cond.condition.equals)) {
							return cond.color
								? { type: 'stateColor', val: cond.color }
								: { type: 'stateIcon', val: cond.icon };
						}
						break;
					case Conditional.lessThanOrEquals:
						if (parseInt(item) <= parseInt(cond.condition.equals)) {
							return cond.color
								? { type: 'stateColor', val: cond.color }
								: { type: 'stateIcon', val: cond.icon };
						}
						break;
					case Conditional.lessThan:
						if (parseInt(item) < parseInt(cond.condition.equals)) {
							return cond.color
								? { type: 'stateColor', val: cond.color }
								: { type: 'stateIcon', val: cond.icon };
						}
						break;
				}
			}
		}
		// if we got to this point, there was no matching conditionals therefore no valid state
		return undefined;
	}

	/**
	 * Finds the index in the passed row of the valure passed; returns -1 if it cannot find it
	 * @param val string to search for
	 * @param row data to search through
	 */
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
		for (let i = 0; i < row.length; i++) {
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
				try {
					await this.connectionManagementService.disconnect(this._connectionUri);
				} catch (e) {
					return Promise.reject(e);
				}
			}
			this._connectionProfile = connectionProfile;
			this._connectionUri = Utils.generateUri(this._connectionProfile, 'insights');
			return this.connectionManagementService.connect(this._connectionProfile, this._connectionUri).then(result => undefined);
		}
	}

	public close() {
		this.hide();
	}

	private get insightActions(): TPromise<IAction[]> {
		const taskRegistry = Registry.as<ITaskRegistry>(TaskExtensions.TaskContribution);
		let tasks = taskRegistry.idToCtorMap;
		let actions = this._insight.details.actions.types;
		let returnActions: IAction[] = [];
		for (let action of actions) {
			let ctor = tasks[action];
			if (ctor) {
				returnActions.push(this._instantiationService.createInstance(ctor, ctor.ID, ctor.LABEL));
			}
		}
		return TPromise.as(returnActions);
	}

	/**
	 * Creates the context that should be passed to the action passed on the selected element
	 * @param element
	 */
	private insightContext(element: ListResource): ITaskActionContext {
		let database = this._insight.details.actions.database || this._connectionProfile.databaseName;
		let server = this._insight.details.actions.server || this._connectionProfile.serverName;
		let user = this._insight.details.actions.user || this._connectionProfile.userName;
		let match: Array<string>;
		if (match = database.match(insertValueRegex)) {
			let index = this.findIndex(match[1], this._columns);
			if (index === -1) {
				console.error('Could not find column', match[1]);
			}
			database = database.replace(match[0], element.data[index]);
		}
		if (match = server.match(insertValueRegex)) {
			let index = this.findIndex(match[1], this._columns);
			if (index === -1) {
				console.error('Could not find column', match[1]);
			}
			server = server.replace(match[0], element.data[index]);
		}
		if (match = user.match(insertValueRegex)) {
			let index = this.findIndex(match[1], this._columns);
			if (index === -1) {
				console.error('Could not find column', match[1]);
			}
			user = user.replace(match[0], element.data[index]);
		}
		let currentProfile = this._connectionProfile as ConnectionProfile;
		let profile = new ConnectionProfile(currentProfile.serverCapabilities, currentProfile);
		profile.databaseName = database;
		profile.serverName = server;
		profile.userName = user;
		return { profile };
	}
}