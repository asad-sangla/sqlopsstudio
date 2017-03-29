/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/connection/dashboard/media/dashboard';
import { ChangeDetectorRef, OnInit } from '@angular/core';
import { IDashboardComponent } from 'sql/parts/connection/dashboard/common/dashboard';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';

declare let AngularCore;

/**
 * Database Explorer component class
 */
@AngularCore.Component({
	selector: 'database-explorer',
	templateUrl: require.toUrl('sql/parts/connection/dashboard/server/database-explorer.component.html'),
	styleUrls: [require.toUrl('sql/parts/connection/dashboard/media/dashboard.css')]
})
export class DatabaseExplorerComponent implements OnInit, IDashboardComponent {

	@AngularCore.Input() public connection: IConnectionProfile;
	@AngularCore.Input() public metadataService: IMetadataService;
	@AngularCore.Input() public scriptingService: IScriptingService;
	@AngularCore.Input() public queryEditorService: IQueryEditorService;
	@AngularCore.Input() public ownerUri: string;

	public databaseNames: string[];

	public selectedObject: string;

	public databaseIcon: string = require.toUrl('sql/parts/connection/dashboard/media/database.svg');

	constructor(
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ChangeDetectorRef)) private changeDetectorRef: ChangeDetectorRef
	) { }

	public ngOnInit(): void {
		this.databaseNames = [];
	}

	public stateInitialized(): void {
		const self = this;
		this.metadataService.getDatabaseNames('1', this.ownerUri).then(result => {
			self.databaseNames = result;
			self.changeDetectorRef.detectChanges();
		});
	}
}
