/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/media/objectTypes/objecttypes';
import 'vs/css!sql/media/icons/icons';

import { Component, Inject, forwardRef, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { IDisposable } from 'vs/base/common/lifecycle';

import { DashboardWidget, IDashboardWidget, WidgetConfig, WIDGET_CONFIG } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { MetadataType } from 'sql/parts/connection/common/connectionManagement';

import { IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';

import data = require('data');

export class ObjectMetadataWrapper {
	public metadata: data.ObjectMetadata;

	public isEqualTo(wrapper: ObjectMetadataWrapper): boolean {
		if (!wrapper) {
			return false;
		}

		return this.metadata.metadataType === wrapper.metadata.metadataType
			&& this.metadata.schema === wrapper.metadata.schema
			&& this.metadata.name === wrapper.metadata.name;
	}

	public static createFromObjectMetadata(objectMetadata: data.ObjectMetadata[]): ObjectMetadataWrapper[] {
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
		backgroundColor: ''
	};
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
		this.init();
	}

	ngOnInit() {
		let self = this;
		self.themeSub = self._bootstrap.themeService.onDidColorThemeChange((theme: IColorTheme) => {
			self.updateColorTheme(theme);
		});
		self.updateColorTheme(self._bootstrap.themeService.getColorTheme());
	}

	ngOnDestroy() {
		this.themeSub.dispose();
	}

	private updateColorTheme(theme: IColorTheme): void {
		this._colors.selectionColor = theme.getColor('list.activeSelectionBackground').toString();
		this._colors.hoverColor = theme.getColor('list.hoverBackground').toString();
		this._colors.backgroundColor = theme.getColor('editor.background').toString();
		this._changeRef.detectChanges();
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

	//tslint:disable-next-line
	private handleItemClick(val: string, index: number): void {
		let self = this;
		self.selected = index;
		if (self._config.context === 'server') {
			self._bootstrap.connectionManagementService.changeDatabase(val).then(result => {
				self._router.navigate(['/database']);
			});
		}
		self._changeRef.detectChanges();
	}

	//tslint:disable-next-line
	private _typeof(val: any, type: string): boolean {
		return typeof val === type;
	}
}
