/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';

import { ChangeDetectorRef, OnInit } from '@angular/core';
import { IDashboardComponent } from 'sql/parts/dashboard/common/dashboard';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

declare let AngularCore;

/**
 * Database Explorer component class
 */
@AngularCore.Component({
	selector: 'database-explorer',
	templateUrl: require.toUrl('sql/parts/dashboard/server/database-explorer.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class DatabaseExplorerComponent implements OnInit, IDashboardComponent {

	@AngularCore.Input() public connection: ConnectionManagementInfo;
	@AngularCore.Input() public metadataService: IMetadataService;
	@AngularCore.Input() public scriptingService: IScriptingService;
	@AngularCore.Input() public queryEditorService: IQueryEditorService;
	@AngularCore.Input() public ownerUri: string;

	public databaseNames: string[];

	public selectedObject: string;

	public databaseIcon: string = require.toUrl('sql/parts/dashboard/media/database.svg');

	constructor(
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ChangeDetectorRef)) private changeDetectorRef: ChangeDetectorRef
	) { }

	public ngOnInit(): void {
		this.databaseNames = [];
	}

	public clearLoadingWheel(): void {
		setTimeout(function(){
			$(".ui-datatable-emptymessage").css('content', 'none');
			$(".ui-datatable-emptymessage").css('color', 'inherit');
			$(".ui-datatable-emptymessage").css('height', 'inherit');
			$(".ui-datatable-emptymessage").css('border', 'inherit');
		}, 5000);
	}

	public stateInitialized(): void {
		const self = this;
		this.metadataService.getDatabaseNames('1', this.ownerUri).then(result => {
			self.databaseNames = result;
			self.changeDetectorRef.detectChanges();
		});
		if (self.databaseNames.length === 0) {
			this.clearLoadingWheel();
		}
	}
}
