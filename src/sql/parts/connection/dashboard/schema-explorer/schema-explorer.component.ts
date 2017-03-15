/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/connection/dashboard/schema-explorer/schema-explorer.component';
import { ChangeDetectorRef, OnInit } from '@angular/core';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import data = require('data');

declare let AngularCore;

/**
 * Schema Explorer component class
 */
@AngularCore.Component({
	selector: 'schema-explorer',
	templateUrl: require.toUrl('sql/parts/connection/dashboard/schema-explorer/schema-explorer.component.html'),
	styleUrls: [require.toUrl('sql/parts/connection/dashboard/schema-explorer/schema-explorer.component.css')]
})
export class SchemaExplorerComponent implements OnInit {

	@AngularCore.Input() public connection: IConnectionProfile;
	@AngularCore.Input() public metadataService: IMetadataService;
	@AngularCore.Input() public scriptingService: IScriptingService;
	@AngularCore.Input() public queryEditorService: IQueryEditorService;
	@AngularCore.Input() public ownerUri: string;

	public objectMetadata: data.ObjectMetadata[];

	constructor(
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ChangeDetectorRef)) private changeDetectorRef: ChangeDetectorRef
	) { }

	public ngOnInit(): void {
		this.objectMetadata = [];

		const self = this;
		this.metadataService.getMetadata('1', this.ownerUri).then(result => {
			self.objectMetadata = result.objectMetadata;
			this.changeDetectorRef.detectChanges();
		});
	}

	/**
	 * Select the top rows from an object
	 */
	public scriptSelect(metadata: data.ObjectMetadata): void {
		let selectScript: string = 'SELECT TOP 1000 *\nFROM ' + metadata.schema + '.' + metadata.name;
		this.queryEditorService.newSqlEditor(selectScript);
	}

	/**
	 * Script the object as a CREATE statement
	 */
	public scriptCreate(metadata: data.ObjectMetadata): void {
		this.scriptingService.scriptAsCreate('1', this.ownerUri, metadata).then(result => {
			if (result && result.script) {
				this.queryEditorService.newSqlEditor(result.script);
			}
		});
	}
}
