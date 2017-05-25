/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import { Component, Input, Inject, forwardRef, ChangeDetectorRef, OnInit } from '@angular/core';
import { IDashboardComponent } from 'sql/parts/dashboard/common/dashboard';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { MetadataType } from 'sql/parts/connection/common/connectionManagement';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IMetadataService } from 'sql/services/metadata/metadataService';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import data = require('data');

/**
 * ObjectMetadata Explorer component class
 */
@Component({
	selector: 'objectmetadata-explorer',
	templateUrl: require.toUrl('sql/parts/dashboard/object/objectmetadata-explorer.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/object/objectmetadata-explorer.component.css')]
})
export class ObjectMetadataExplorerComponent implements OnInit, IDashboardComponent {

	@Input() public connection: ConnectionManagementInfo;;
	@Input() public metadataService: IMetadataService;
	@Input() public scriptingService: IScriptingService;
	@Input() public queryEditorService: IQueryEditorService;
	@Input() public ownerUri: string;
	@Input() public objectMetadata: data.ObjectMetadata;

	public columns: data.ColumnMetadata[];

	public selectedObject: data.ColumnMetadata;

	public databaseIcon: string = require.toUrl('sql/parts/dashboard/media/database.svg');

	constructor(
		@Inject(forwardRef(() => ChangeDetectorRef)) private changeDetectorRef: ChangeDetectorRef
	) { }

	public ngOnInit(): void {
		this.columns = [];
	}

	public clearLoadingWheel(): void {
		setTimeout(function(){
			$('.ui-datatable-emptymessage').css('content', 'none');
			$('.ui-datatable-emptymessage').css('color', 'inherit');
			$('.ui-datatable-emptymessage').css('height', 'inherit');
			$('.ui-datatable-emptymessage').css('border', 'inherit');
		}, 5000);
	}

	public stateInitialized(): void {
		const self = this;

		if (this.objectMetadata.metadataType === MetadataType.Table) {
			this.metadataService.getTableInfo(this.ownerUri, this.objectMetadata).then(result => {
				self.columns = result;
				self.changeDetectorRef.detectChanges();
			});
		} else if (this.objectMetadata.metadataType === MetadataType.View) {
			this.metadataService.getViewInfo(this.ownerUri, this.objectMetadata).then(result => {
				self.columns = result;
				self.changeDetectorRef.detectChanges();
			});
		}
		if (self.columns.length === 0) {
			this.clearLoadingWheel();
		}
	}
}
