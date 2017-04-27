/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';
import { ChangeDetectorRef, OnInit } from '@angular/core';
import { IDashboardComponent } from 'sql/parts/dashboard/common/dashboard';
import { MetadataType, IConnectableInput, IConnectionManagementService,
		IConnectionCompletionOptions, ConnectionType  } from 'sql/parts/connection/common/connectionManagement';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IMetadataService } from 'sql/services/metadata/metadataService';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import { EditDataInput } from 'sql/parts/editData/common/editDataInput';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

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
	templateUrl: require.toUrl('sql/parts/dashboard/database/schema-explorer.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class SchemaExplorerComponent implements OnInit, IDashboardComponent {

	@AngularCore.Input() public loading: boolean;
	@AngularCore.Input() public connection: ConnectionManagementInfo;
	@AngularCore.Input() public metadataService: IMetadataService;
	@AngularCore.Input() public scriptingService: IScriptingService;
	@AngularCore.Input() public queryEditorService: IQueryEditorService;
	@AngularCore.Input() public connectionService: IConnectionManagementService;
	@AngularCore.Input() public ownerUri: string;


	public objectMetadata: ObjectMetadataWrapper[];

	public selectedObject: ObjectMetadataWrapper;

	public databaseIcon: string = require.toUrl('sql/parts/dashboard/media/database.svg');

	constructor(
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ChangeDetectorRef)) private changeDetectorRef: ChangeDetectorRef
	) { }

	public ngOnInit(): void {
		this.objectMetadata = [];
	}

	public clearLoadingWheel(): void {
		setTimeout(function(){
			$('.ui-datatable-emptymessage').css('content', 'none');
			$('.ui-datatable-emptymessage').css('color', 'inherit');
			$('.ui-datatable-emptymessage').css('height', 'inherit');
			$('.ui-datatable-emptymessage').css('border', 'inherit');
		}, 5000);
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

	public stateInitialized(): void {
		const self = this;
		this.metadataService.getMetadata(this.ownerUri).then(result => {
			self.objectMetadata = ObjectMetadataWrapper.createFromObjectMetadata(result.objectMetadata);
			self.objectMetadata.sort(this.schemaSort);
			self.changeDetectorRef.detectChanges();
		});
		if (self.objectMetadata.length === 0) {
			this.clearLoadingWheel();
		}
	}

	public isBrowseEnabled(): boolean {
		return this.selectedObject
			&& (this.selectedObject.metadata.metadataType === MetadataType.Table
			|| this.selectedObject.metadata.metadataType === MetadataType.View);
	}

	public isExecuteEnabled(): boolean {
		return this.selectedObject
			&& (this.selectedObject.metadata.metadataType === MetadataType.SProc);
	}

	public executeProcedure(): void {
		if (this.selectedObject) {
			let executeString = 'EXEC ' + this.selectedObject.metadata.name;
			this.queryEditorService.newSqlEditor(executeString);
		}
	}

	public isTable(metadataType: MetadataType): boolean {
		return metadataType === MetadataType.Table;
	}

	public isProcedure(metadataType: MetadataType): boolean {
		return metadataType === MetadataType.SProc;
	}

	public isView(metadataType: MetadataType): boolean {
		return metadataType === MetadataType.View;
	}

	public browseObjects() : void {
		$('#browse-button').click();
	}

	/**
	 * Select the top rows from an object
	 */
	public scriptSelect(): void {
		if (this.selectedObject) {
			this.scriptingService.scriptAsSelect(this.ownerUri, this.selectedObject.metadata).then(result => {
				if (result && result.script) {
					this.queryEditorService.newSqlEditor(result.script).then((owner: IConnectableInput) => {
						// Connect our editor to the input connection
						let options: IConnectionCompletionOptions = {
							params: { connectionType: ConnectionType.editor, runQueryOnCompletion: true, input: owner },
							saveToSettings: false,
							showDashboard: false,
							showConnectionDialogOnError: true
						};
						this.connectionService.connect(this.connection.connectionProfile, owner.uri, options);
					});
				}
			});
		}
	}

	/**
	 * Opens a new Edit Data session
	 */
	public editData(): void {
		if (this.selectedObject) {
			this.queryEditorService.newEditDataEditor(this.selectedObject.metadata.name).then((owner: EditDataInput) => {
				// Connect our editor
				let options: IConnectionCompletionOptions = {
					params: { connectionType: ConnectionType.editor, runQueryOnCompletion: false, input: owner },
					saveToSettings: false,
					showDashboard: false,
					showConnectionDialogOnError: true
				};

				this.connectionService.connect(this.connection.connectionProfile, owner.uri, options);
			});
		}
	}

	/**
	 * Script the object as a CREATE statement
	 */
	public scriptCreate(): void {
		if (this.selectedObject) {
			this.scriptingService.scriptAsCreate(this.ownerUri, this.selectedObject.metadata).then(result => {
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
