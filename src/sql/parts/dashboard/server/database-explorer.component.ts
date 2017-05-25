/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';

import { Component, Input, Inject, forwardRef, ChangeDetectorRef, OnInit } from '@angular/core';
import { IDashboardComponent } from 'sql/parts/dashboard/common/dashboard';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IMetadataService } from 'sql/services/metadata/metadataService';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

/**
 * Database Explorer component class
 */
@Component({
	selector: 'database-explorer',
	templateUrl: require.toUrl('sql/parts/dashboard/server/database-explorer.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class DatabaseExplorerComponent implements OnInit, IDashboardComponent {

	@Input() public connection: ConnectionManagementInfo;
	@Input() public metadataService: IMetadataService;
	@Input() public scriptingService: IScriptingService;
	@Input() public queryEditorService: IQueryEditorService;
	@Input() public ownerUri: string;

	public databaseNames: string[];

	public selectedObject: string;

	public databaseIcon: string = require.toUrl('sql/parts/dashboard/media/database.svg');

	constructor(
		@Inject(forwardRef(() => ChangeDetectorRef)) private changeDetectorRef: ChangeDetectorRef
	) { }

	public ngOnInit(): void {
		this.databaseNames = [];
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
		this.metadataService.getDatabaseNames(this.ownerUri).then(result => {
			self.databaseNames = result;
			self.changeDetectorRef.detectChanges();
		});
		if (self.databaseNames.length === 0) {
			this.clearLoadingWheel();
		}
	}

	public browseDatabases(): void {
		$('#browse-button').click();
	}
}
