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
			wrapperArray[i] = <ObjectMetadataWrapper> {
				metadata: objectMetadata[i]
			};
		}
		return wrapperArray;
	}
}

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

	public objectMetadata: ObjectMetadataWrapper[];

	public selectedObject: ObjectMetadataWrapper;

	public databaseIcon: string = require.toUrl('sql/parts/connection/dashboard/media/database.svg');

	constructor(
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ChangeDetectorRef)) private changeDetectorRef: ChangeDetectorRef
	) { }

	public ngOnInit(): void {
		this.objectMetadata = [];

		const self = this;
		this.metadataService.getMetadata('1', this.ownerUri).then(result => {
			self.objectMetadata = ObjectMetadataWrapper.createFromObjectMetadata(result.objectMetadata);
			this.changeDetectorRef.detectChanges();
		});
	}

	/**
	 * Select the top rows from an object
	 */
	public scriptSelect(): void {
		if (this.selectedObject) {
			this.scriptingService.scriptAsSelect('1', this.ownerUri, this.selectedObject.metadata).then(result => {
				if (result && result.script) {
					this.queryEditorService.newSqlEditor(result.script);
				}
			});
		}
	}

	/**
	 * Script the object as a CREATE statement
	 */
	public scriptCreate(): void {
		if (this.selectedObject) {
			this.scriptingService.scriptAsCreate('1', this.ownerUri, this.selectedObject.metadata).then(result => {
				if (result && result.script) {

					 let script = result.script;
					 var startPos: number = script.indexOf('CREATE');
					 if (startPos > 0) {
						script = script.substring(startPos);
					 }

					this.queryEditorService.newSqlEditor(script);
				}
			});
		}
	}
}
