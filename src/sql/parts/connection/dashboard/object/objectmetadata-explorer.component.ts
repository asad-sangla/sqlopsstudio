/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/connection/dashboard/media/dashboard';
import { ChangeDetectorRef, OnInit } from '@angular/core';
import { IDashboardComponent } from 'sql/parts/connection/dashboard/common/dashboard';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { MetadataType } from 'sql/parts/connection/common/connectionManagement';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import data = require('data');

declare let AngularCore;

/**
 * ObjectMetadata Explorer component class
 */
@AngularCore.Component({
	selector: 'objectmetadata-explorer',
	templateUrl: require.toUrl('sql/parts/connection/dashboard/object/objectmetadata-explorer.component.html'),
	styleUrls: [require.toUrl('sql/parts/connection/dashboard/object/objectmetadata-explorer.component.css')]
})
export class ObjectMetadataExplorerComponent implements OnInit, IDashboardComponent {

	@AngularCore.Input() public connection: ConnectionManagementInfo;;
	@AngularCore.Input() public metadataService: IMetadataService;
	@AngularCore.Input() public scriptingService: IScriptingService;
	@AngularCore.Input() public queryEditorService: IQueryEditorService;
	@AngularCore.Input() public ownerUri: string;
	@AngularCore.Input() public objectMetadata: data.ObjectMetadata;

	public columns: data.ColumnMetadata[];

	public selectedObject: data.ColumnMetadata;

	public databaseIcon: string = require.toUrl('sql/parts/connection/dashboard/media/database.svg');

	constructor(
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ChangeDetectorRef)) private changeDetectorRef: ChangeDetectorRef
	) { }

	public ngOnInit(): void {
		this.columns = [];
	}

	public stateInitialized(): void {
		const self = this;

		if (this.objectMetadata.metadataType === MetadataType.Table) {
			this.metadataService.getTableInfo('1', this.ownerUri, this.objectMetadata).then(result => {
				self.columns = result;
				self.changeDetectorRef.detectChanges();
			});
		} else if (this.objectMetadata.metadataType === MetadataType.View) {
			this.metadataService.getViewInfo('1', this.ownerUri, this.objectMetadata).then(result => {
				self.columns = result;
				self.changeDetectorRef.detectChanges();
			});
		}
	}
}
