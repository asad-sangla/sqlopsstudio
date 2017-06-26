/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/media/objectTypes/objecttypes';
import 'vs/css!sql/media/icons/common-icons';

import { Component, Inject, forwardRef, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { DashboardWidget, IDashboardWidget, WidgetConfig, WIDGET_CONFIG } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { MetadataType } from 'sql/parts/connection/common/connectionManagement';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { BaseActionContext } from 'sql/common/baseActions';
import { GetExplorerActions } from './explorerActions';

import { IDisposable } from 'vs/base/common/lifecycle';
import * as colors from 'vs/platform/theme/common/colorRegistry';
import { registerThemingParticipant, ICssStyleCollector, ITheme } from 'vs/platform/theme/common/themeService';

import { ObjectMetadata } from 'data';

export class ObjectMetadataWrapper {
	public metadata: ObjectMetadata;

	public isEqualTo(wrapper: ObjectMetadataWrapper): boolean {
		if (!wrapper) {
			return false;
		}

		return this.metadata.metadataType === wrapper.metadata.metadataType
			&& this.metadata.schema === wrapper.metadata.schema
			&& this.metadata.name === wrapper.metadata.name;
	}

	public static createFromObjectMetadata(objectMetadata: ObjectMetadata[]): ObjectMetadataWrapper[] {
		if (!objectMetadata) {
			return undefined;
		}

		let wrapperArray = new Array(objectMetadata.length);
		for (let i = 0; i < objectMetadata.length; ++i) {
			wrapperArray[i] = <ObjectMetadataWrapper>{
				metadata: objectMetadata[i]
			};
		}
		return wrapperArray;
	}
}

interface Colors {
	selectionColor: string;
	hoverColor: string;
	backgroundColor: string;
	border: string;
}

@Component({
	selector: 'explorer-widget',
	templateUrl: require.toUrl('sql/parts/dashboard/widgets/explorer/explorerWidget.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class ExplorerWidget extends DashboardWidget implements IDashboardWidget, OnInit, OnDestroy {

	private tableData: ObjectMetadataWrapper[] | string[];
	private selectedRow: ObjectMetadataWrapper;
	private _colors: Colors = {
		selectionColor: '',
		hoverColor: '',
		backgroundColor: '',
		border: 'none'
	};
	private isCloud: boolean;
	//tslint:disable-next-line
	private dataType = MetadataType;
	private filterString = '';
	private selected: number;
	private hovered: number;
	private themeSub: IDisposable;
	//tslint:disable-next-line
	private filterArray = [
		'view',
		'table',
		'proc',
		'func'
	];

	constructor(
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface,
		@Inject(forwardRef(() => Router)) private _router: Router,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef,
		@Inject(WIDGET_CONFIG) protected _config: WidgetConfig
	) {
		super();
		this.isCloud = _bootstrap.connectionManagementService.connectionInfo.serverInfo.isCloud;
		this.init();
	}

	ngOnInit() {
		this.themeSub = registerThemingParticipant(this.registerThemeing);
	}

	ngOnDestroy() {
		this.themeSub.dispose();
	}

	private registerThemeing(theme: ITheme, collector: ICssStyleCollector) {
		let selectionBackground = theme.getColor(colors.listActiveSelectionBackground);
		let hoverColor = theme.getColor(colors.listHoverBackground);
		let backgroundColor = theme.getColor(colors.editorBackground);
		let contrastBorder = theme.getColor(colors.contrastBorder);
		let activeContrastBorder = theme.getColor(colors.activeContrastBorder);
		if (backgroundColor) {
			let backgroundString = backgroundColor.toString();
			collector.addRule(`.explorer-widget .explorer-table .explorer-row { background-color: ${backgroundString} }`);
		}
		if (hoverColor) {
			let hoverString = hoverColor.toString();
			collector.addRule(`.explorer-widget .explorer-table .explorer-row.hover { background-color: ${hoverString} }`);
		}
		if (selectionBackground) {
			let selectionString = selectionBackground.toString();
			collector.addRule(`.explorer-widget .explorer-table .explorer-row.selected { background-color: ${selectionString} }`);
		}
		if (contrastBorder) {
			let contrastBorderString = activeContrastBorder.toString();
			collector.addRule(`.explorer-widget .explorer-table .explorer-row { border: 1px solid transparent}`);
			collector.addRule(`.explorer-widget .explorer-table .explorer-row.hover { border: 1px dotted ${contrastBorderString} }`);
			collector.addRule(`.explorer-widget .explorer-table .explorer-row.selected { border: 1px solid ${contrastBorderString} }`);
		}
	}

	private init(): void {
		let self = this;
		if (self._config.context === 'database') {
			self._bootstrap.metadataService.metadata.then((data) => {
				if (data) {
					self.tableData = ObjectMetadataWrapper.createFromObjectMetadata(data.objectMetadata);
					self.tableData.sort(this.schemaSort);
					if (self.tableData.length > 0) {
						self.selectedRow = self.tableData[0];
					}
				}
				self._changeRef.detectChanges();
			});
		} else {
			self._bootstrap.metadataService.databaseNames.then((data) => {
				self.tableData = data;
				self._changeRef.detectChanges();
			});
		}
	}

	// custom sort : Table > View > Stored Procedures
	private schemaSort(metadataWrapper1, metadataWrapper2): number {
		var metadata1 = metadataWrapper1.metadata;
		var metadata2 = metadataWrapper2.metadata;
		if (metadata1.metadataType === MetadataType.Table) {
			return -1;
		}
		else if (metadata1.metadataType === MetadataType.SProc) {
			return 1;
		}
		else if (metadata1.metadataType === MetadataType.View) {
			if (metadata2.metadataType === MetadataType.Table) {
				return 1;
			} else if (metadata2.metadataType === MetadataType.SProc) {
				return -1;
			}
		}
		return -1;
	}

	//tslint:disable-next-line
	private handleFilterMenu(filterVal: string): void {
		this.filterString = filterVal + ':' + this.filterString;
	}

	//tslint:disable-next-line
	private handleHover(index: number, enter: boolean): void {
		if (this.hovered === index && !enter) {
			this.hovered = undefined;
		} else {
			this.hovered = index;
		}

		this._changeRef.detectChanges();
	}

	/**
	 * Handles action when an item is double clicked in the explorer widget
	 * @param val If on server page, explorer objects will be strings representing databases;
	 * If on databasepage, explorer objects will be ObjectMetadataWrapper representing object types;
	 *
	 */
	//tslint:disable-next-line
	private handleItemDoubleClick(val: string | ObjectMetadataWrapper): void {
		let self = this;
		self._bootstrap.connectionManagementService.changeDatabase(val as string).then(result => {
			self._router.navigate(['database-dashboard']);
		});
	}

	/**
	 * Handles action when a item is clicked in the explorer widget
	 * @param val If on server page, explorer objects will be strings representing databases;
	 * If on databasepage, explorer objects will be ObjectMetadataWrapper representing object types;
	 * @param index Index of the value in the array the ngFor template is built from
	 * @param event Click event
	 */
	//tslint:disable-next-line
	private handleItemClick(val: string | ObjectMetadataWrapper, index: number, event: any): void {
		let self = this;
		self.selected = index;
		// event will exist if the context menu span was clicked
		if (event) {
			if (self._config.context === 'server') {
				let anchor = { x: event.pageX + 1, y: event.pageY };
				let newProfile = <IConnectionProfile> Object.create(self._bootstrap.connectionManagementService.connectionInfo.connectionProfile);
				newProfile.databaseName = val as string;
				self._bootstrap.contextMenuService.showContextMenu({
					getAnchor: () => anchor,
					getActions: () => GetExplorerActions(undefined, self.isCloud, self._bootstrap),
					getActionsContext: () => {
						return <BaseActionContext> {
							uri: self._bootstrap.getUnderlyingUri(),
							profile: newProfile,
							connInfo: self._bootstrap.connectionManagementService.connectionInfo,
							databasename: val as string
						};
					}
				});
			} else if (self._config.context === 'database') {
				let object = val as ObjectMetadataWrapper;
				let anchor = { x: event.pageX + 1, y: event.pageY };
				self._bootstrap.contextMenuService.showContextMenu({
					getAnchor: () => anchor,
					getActions: () => GetExplorerActions(object.metadata.metadataType, self.isCloud, self._bootstrap),
					getActionsContext: () => {
						return <BaseActionContext>{
							object: object.metadata,
							uri: self._bootstrap.getUnderlyingUri(),
							profile: self._bootstrap.connectionManagementService.connectionInfo.connectionProfile
						};
					}
				});
			} else {
				console.log('Unknown dashboard context: ', self._config.context);
			}
		}
		self._changeRef.detectChanges();
	}
}
