/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import 'vs/css!sql/parts/insights/browser/media/insightsDialog';

import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { Modal } from 'sql/parts/common/modal/modal';
import { IInsightsConfigDetails } from 'sql/parts/dashboard/widgets/insights/interfaces';
import { attachModalDialogStyler, attachTableStyler } from 'sql/common/theme/styler';
import { ITaskRegistry, Extensions as TaskExtensions } from 'sql/platform/tasks/taskRegistry';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { ITaskActionContext } from 'sql/workbench/common/actions';
import * as TelemetryKeys from 'sql/common/telemetryKeys';
import { IInsightsDialogModel, ListResource } from 'sql/parts/insights/common/interfaces';
import { TableCollapsibleView } from 'sql/base/browser/ui/table/tableView';
import { TableDataView } from 'sql/base/browser/ui/table/tableDataView';
import { RowSelectionModel } from 'sql/base/browser/ui/table/plugins/rowSelectionModel.plugin';

import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import * as DOM from 'vs/base/browser/dom';
import { SplitView, ViewSizing } from 'vs/base/browser/ui/splitview/splitview';
import { IDisposable } from 'vs/base/common/lifecycle';
import { attachButtonStyler } from 'vs/platform/theme/common/styler';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IListService } from 'vs/platform/list/browser/listService';
import * as nls from 'vs/nls';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { Registry } from 'vs/platform/registry/common/platform';
import { IAction } from 'vs/base/common/actions';
import { TPromise } from 'vs/base/common/winjs.base';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import * as types from 'vs/base/common/types';

/* Regex that matches the form `${value}` */
export const insertValueRegex: RegExp = /\${(.*?)\}/;

function stateFormatter(row: number, cell: number, value: any, columnDef: Slick.Column<ListResource>, resource: ListResource): string {
	// template
	const icon = DOM.$('span.icon-span');
	const badge = DOM.$('div.badge');
	const badgeContent = DOM.$('div.badge-content');
	DOM.append(badge, badgeContent);
	DOM.append(icon, badge);

	// render icon if passed
	if (resource.icon) {
		icon.classList.add('icon');
		icon.classList.add(resource.icon);
	} else {
		icon.classList.remove('icon');
	}

	//render state badge if present
	if (resource.stateColor) {
		badgeContent.style.backgroundColor = resource.stateColor;
		badgeContent.classList.remove('icon');
	} else if (resource.stateIcon) {
		badgeContent.style.backgroundColor = '';
		badgeContent.classList.add('icon');
		badgeContent.classList.add(resource.stateIcon);
	} else {
		badgeContent.classList.remove('icon');
		badgeContent.style.backgroundColor = '';
	}

	return icon.outerHTML;
}

export class InsightsDialogView extends Modal {
	private _connectionProfile: IConnectionProfile;
	private _insight: IInsightsConfigDetails;
	private _disposables: IDisposable[] = [];
	private _splitView: SplitView;
	private _container: HTMLElement;
	private _topTableData: TableDataView<ListResource>;
	private _bottomTableData: TableDataView<ListResource>;
	private _topColumns: Array<Slick.Column<ListResource>> = [
		{
			name: nls.localize("state", "State"),
			field: 'state',
			id: 'state',
			width: 20,
			resizable: false,
			formatter: stateFormatter
		},
		{
			name: nls.localize("label", "Label"),
			field: 'label',
			id: 'label'
		},
		{
			name: nls.localize("value", "Value"),
			field: 'value',
			id: 'value'
		}
	];
	private _bottomColumns: Array<Slick.Column<ListResource>> = [
		{
			name: nls.localize("label", "Label"),
			field: 'label',
			id: 'label'
		},
		{
			name: nls.localize("value", "Value"),
			field: 'value',
			id: 'value'
		}
	];

	constructor(
		private _model: IInsightsDialogModel,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IThemeService private _themeService: IThemeService,
		@IListService private _listService: IListService,
		@IPartService partService: IPartService,
		@IContextMenuService private _contextMenuService: IContextMenuService,
		@ITelemetryService telemetryService: ITelemetryService
	) {
		super(nls.localize("InsightsDialogTitle", "Insights"), TelemetryKeys.Insights, partService, telemetryService);
		this._model.onDataChange(e => this.build());
	}

	protected renderBody(container: HTMLElement) {
		this._container = container;

		this._splitView = new SplitView(container);

		this._topTableData = new TableDataView();
		this._bottomTableData = new TableDataView();

		let topTable = new TableCollapsibleView(nls.localize("insights.dialog.chartData", "Chart Data"), { sizing: ViewSizing.Flexible, ariaHeaderLabel: 'title' }, this._topTableData, this._topColumns, { forceFitColumns: true });
		topTable.addContainerClass('insights');
		topTable.table.setSelectionModel(new RowSelectionModel<ListResource>());
		let bottomTable = new TableCollapsibleView(nls.localize("insights.dialog.queryData", "Query Data"), { sizing: ViewSizing.Flexible, ariaHeaderLabel: 'title' }, this._bottomTableData, this._bottomColumns, { forceFitColumns: true });

		this._disposables.push(topTable.table.onSelectedRowsChanged((e: DOMEvent, data: Slick.OnSelectedRowsChangedEventArgs<ListResource>) => {
			if (data.rows.length === 1) {
				let element = this._topTableData.getItem(data.rows[0]);
				let resourceArray: ListResource[] = [];
				for (let i = 0; i < this._model.columns.length; i++) {
					resourceArray.push({ label: this._model.columns[i], value: element.data[i], data: element.data });
				}
				this._bottomTableData.clear();
				this._bottomTableData.push(resourceArray);
			}
		}));

		this._disposables.push(bottomTable.table.onContextMenu((e: DOMEvent, data: Slick.OnContextMenuEventArgs<any>) => {
			this._contextMenuService.showContextMenu({
				getAnchor: () => e.target as HTMLElement,
				getActions: () => this.insightActions,
				getActionsContext: () => this.insightContext(this._bottomTableData.getItem(bottomTable.table.getCellFromEvent(e).row))
			});
		}));

		this._splitView.addView(topTable);
		this._splitView.addView(bottomTable);

		this._disposables.push(attachTableStyler(topTable.table, this._themeService));
		this._disposables.push(attachTableStyler(bottomTable.table, this._themeService));
	}

	public render() {
		super.render();
		let button = this.addFooterButton('Close', () => this.close());
		this._disposables.push(attachButtonStyler(button, this._themeService));
		this._disposables.push(attachModalDialogStyler(this, this._themeService));
	}

	protected layout(height?: number): void {
		this._splitView.layout(DOM.getContentHeight(this._container));
	}

	// insight object
	public open(input: IInsightsConfigDetails, connectionProfile: IConnectionProfile): void {
		if (types.isUndefinedOrNull(input) || types.isUndefinedOrNull(connectionProfile)) {
			return;
		}
		this._insight = input;
		this._connectionProfile = connectionProfile;
		this.show();
	}

	private build(): void {
		let labelIndex: number;
		let valueIndex: number;
		let columnName = typeof this._insight.label === 'object' ? this._insight.label.column : this._insight.label;
		if (this._insight.label === undefined || (labelIndex = this._model.columns.indexOf(columnName)) === -1) {
			labelIndex = 0;
		}
		if (this._insight.value === undefined || (valueIndex = this._model.columns.indexOf(this._insight.value)) === -1) {
			valueIndex = 1;
		}
		// convert
		let inputArray = this._model.getListResources(labelIndex, valueIndex);
		this._topTableData.clear();
		this._topTableData.push(inputArray);
		this.layout();
	}

	public close() {
		this.hide();
	}

	private get insightActions(): TPromise<IAction[]> {
		const taskRegistry = Registry.as<ITaskRegistry>(TaskExtensions.TaskContribution);
		let tasks = taskRegistry.idToCtorMap;
		let actions = this._insight.actions.types;
		let returnActions: IAction[] = [];
		for (let action of actions) {
			let ctor = tasks[action];
			if (ctor) {
				returnActions.push(this._instantiationService.createInstance(ctor, ctor.ID, ctor.LABEL, ctor.ICON));
			}
		}
		return TPromise.as(returnActions);
	}

	/**
	 * Creates the context that should be passed to the action passed on the selected element
	 * @param element
	 */
	private insightContext(element: ListResource): ITaskActionContext {
		let database = this._insight.actions.database || this._connectionProfile.databaseName;
		let server = this._insight.actions.server || this._connectionProfile.serverName;
		let user = this._insight.actions.user || this._connectionProfile.userName;
		let match: Array<string>;
		match = database.match(insertValueRegex);
		if (match && match.length > 0) {
			let index = this._model.columns.indexOf(match[1]);
			if (index === -1) {
				console.error('Could not find column', match[1]);
			} else {
				database = database.replace(match[0], element.data[index]);
			}
		}

		match = server.match(insertValueRegex);
		if (match && match.length > 0) {
			let index = this._model.columns.indexOf(match[1]);
			if (index === -1) {
				console.error('Could not find column', match[1]);
			} else {
				server = server.replace(match[0], element.data[index]);
			}
		}

		match = user.match(insertValueRegex);
		if (match && match.length > 0) {
			let index = this._model.columns.indexOf(match[1]);
			if (index === -1) {
				console.error('Could not find column', match[1]);
			} else {
				user = user.replace(match[0], element.data[index]);
			}
		}

		let currentProfile = this._connectionProfile as ConnectionProfile;
		let profile = new ConnectionProfile(currentProfile.serverCapabilities, currentProfile);
		profile.databaseName = database;
		profile.serverName = server;
		profile.userName = user;
		return { profile };
	}
}