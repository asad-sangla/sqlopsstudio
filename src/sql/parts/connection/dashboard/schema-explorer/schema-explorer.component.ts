import { OnInit } from '@angular/core';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';

declare let AngularCore;

@AngularCore.Component({
	selector: 'schema-explorer',
	templateUrl: require.toUrl('sql/parts/connection/dashboard/schema-explorer/schema-explorer.component.html'),
	styleUrls: [require.toUrl('sql/parts/connection/dashboard/schema-explorer/schema-explorer.component.css')]
})
export class SchemaExplorerComponent implements OnInit {

	@AngularCore.Input() public connection: IConnectionProfile;
	@AngularCore.Input() public metadataService: IMetadataService;
	@AngularCore.Input() public scriptingService: IScriptingService;

	public metadata: string[];

	constructor() { }

	ngOnInit() {
		this.metadataService.getMetadata('mssql', this.connection.serverName).then(r => {
		});

		this.scriptingService.scriptObject('mssql', this.connection.serverName, 'dbo.all_objects').then(r => {
		});
	}
}
