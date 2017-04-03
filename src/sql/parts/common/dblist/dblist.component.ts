/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/common/dblist/dblist.component';
import 'vs/css!sql/media/primeng';

import { OnInit, OnDestroy } from '@angular/core';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IDbListInterop } from 'sql/parts/common/dblist/dbListInterop';
import { IConnectionManagementService, } from 'sql/parts/connection/common/connectionManagement';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/parts/bootstrap/bootstrapService';
import { DbListComponentParams } from 'sql/parts/bootstrap/bootstrapParams';
import { SelectItem } from 'primeng/primeng';

declare let AngularCore;

@AngularCore.Component({
	selector: 'database-list',
	templateUrl: require.toUrl('sql/parts/common/dblist/dblist.component.html'),
	styleUrls: [require.toUrl('sql/parts/common/dblist/dblist.component.css'), require.toUrl('sql/media/primeng.css')]
})
export class DbListComponent implements OnInit, OnDestroy {

	public databases: SelectItem[];

	private toDispose: IDisposable[];
	private currentDatabaseName: string;
	private isConnected: boolean;
	private id: string;
	private dbListInterop: IDbListInterop;
	private connectionService: IConnectionManagementService;

	constructor(
        @AngularCore.Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService,
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ElementRef)) private _el: any,
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ChangeDetectorRef)) private changeDetectorRef: any) {
	}

	public ngOnInit(): void {

        this.id = this._el.nativeElement.parentElement.getAttribute('bootstrap-id');
        let bootstrapParams = <DbListComponentParams> this._bootstrapService.getBootstrapParams(this.id);
		this.dbListInterop = bootstrapParams.dbListInterop;

		this.connectionService = this._bootstrapService.connectionManagementService;
		this.toDispose = [];
		this.databases = [];
		this._registerListeners();
	}

	public ngOnDestroy(): void {
		this.toDispose = dispose(this.toDispose);
	}

	public onDbChanged = (action): void => {
		this.dbListInterop.databaseSelected(this.currentDatabaseName);
	}

	public onFocus = (action): void => {
		let self = this;
		let uri = this._getConnectedUri();
		if (uri) {
			this.connectionService.listDatabases(uri).then(result => {
				if (result && result.databaseNames) {
					self.databases = result.databaseNames.map(n => {
						return { label: n, value: n };
					});
					self._refreshDatabaseList();
				}
			});
		}
	}

	public onConnected(): void {
		let dbName = this._getCurrentDatabaseName();
		this.updateConnection(dbName);
	}

	public onConnectionChanged(updatedConnection: IConnectionProfile): void {
		if (updatedConnection) {
			this.updateConnection(updatedConnection.databaseName);
		}
	}

	public get isDisabled(): boolean {
		return !this.databases || this.databases.length === 0;
	}

	private updateConnection(databaseName: string) {
		this.isConnected = true;
		// TODO: query the connection service for a cached list of databases on the server
		this.databases = [];
		this.currentDatabaseName = databaseName;
		if (this.currentDatabaseName) {
			this.databases.push({ label: this.currentDatabaseName, value: this.currentDatabaseName } );
		}
		this._refreshDatabaseList();
	}

	public onDisconnect(): void {
		this.isConnected = false;
		this.currentDatabaseName = undefined;
		this.databases = [];
		this._refreshDatabaseList();
	}

	private _refreshDatabaseList(): void {
		this.changeDetectorRef.detectChanges();
	}

	private _registerListeners(): void {
		let self = this;
		this.toDispose.push(this.connectionService.onConnectionChanged((connChanged) => {
			let uri = self._getConnectedUri();
			if (uri && uri === connChanged.connectionUri) {
				self.onConnectionChanged(connChanged.connectionInfo);
			}
		}));

		this.toDispose.push(this.dbListInterop.onDatabaseChanged((dbName) => {
			this.updateConnection(dbName);
		}));
	}

	private _getCurrentDatabaseName() {
		let uri = this._getConnectedUri();
		if (uri) {
			let profile = this.connectionService.getConnectionProfile(uri);
			if (profile) {
				return profile.databaseName;
			}
		}
		return undefined;
	}

	/**
	 * Returns the URI of the given editor if it is not undefined and is connected.
	 */
	private _getConnectedUri(): string {
		return this.connectionService.isConnected(this.connectionUri) ? this.connectionUri : undefined;
	}

	private get connectionUri(): string {
		return this.dbListInterop ? this.dbListInterop.lookupUri(this.id) : undefined;
	}
}
