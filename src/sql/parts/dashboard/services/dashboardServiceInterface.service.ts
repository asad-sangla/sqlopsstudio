/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Injectable, Inject } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { DashboardComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { IMetadataService } from 'sql/services/metadata/metadataService';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { TaskUtilities } from 'sql/common/taskUtilities';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { IAdminService } from 'sql/parts/admin/common/adminService';

import { IWorkbenchThemeService } from 'vs/workbench/services/themes/common/workbenchThemeService';

import { ProviderMetadata, DatabaseInfo } from 'data';

/* Wrapper for a metadata service that contains the uri string to use on each request */
export class SingleConnectionMetadataService {

	constructor(
		private _metadataService: IMetadataService,
		private _uri: string
	) { }

	get metadata(): Thenable<ProviderMetadata> {
		return this._metadataService.getMetadata(this._uri);
	}

	get databaseNames(): Thenable<string[]> {
		return this._metadataService.getDatabaseNames(this._uri);
	}
}

/* Wrapper for a connection service that contains the uri string to use on each request */
export class SingleConnectionManagementService {

	private _onDidChangeConnection = new Subject<ConnectionManagementInfo>();

	constructor(
		private _connectionService: IConnectionManagementService,
		private _uri: string
	) { }

	public changeDatabase(name: string): Thenable<boolean> {
		let self = this;
		return this._connectionService.changeDatabase(this._uri, name).then((result) => {
			self._onDidChangeConnection.next(self.connectionInfo);
			return result;
		});
	}

	public get connectionInfo(): ConnectionManagementInfo {
		return this._connectionService.getConnectionInfo(this._uri);
	}

	public onDidChangeConnection(cb: (con: ConnectionManagementInfo) => void): Subscription {
		return this._onDidChangeConnection.subscribe(cb);
	}
}

export class SingleAdminService {

	constructor(
		private _adminService: IAdminService,
		private _uri: string
	) { }

	public get databaseInfo(): Thenable<DatabaseInfo> {
		return this._adminService.getDatabaseInfo(this._uri);
	}
}

/* Deferred implementation is make code look nicer */
class Deferred<T> {

	promise: Promise<T>;
	resolve: (value?: T | PromiseLike<T>) => void;
	reject:  (reason?: any) => void;

	constructor() {
		this.promise = new Promise<T>((resolve, reject) => {
			this.resolve = resolve;
			this.reject  = reject;
		});
	}
}

/*
	Providers a interface between a dashboard interface and the rest of carbon.
	Stores the uri and unique selector of a dashboard instance and uses that
	whenever a call to a carbon service needs this information, so that the widget
	don't need to be aware of the uri or selector. Simplifies the initialization and
	usage of a widget.
*/
@Injectable()
export class DashboardServiceInterface {
	private _uniqueSelector: string;
	private _uri: string;
	/* Bootstrap params*/
	private _bootstrapParams: DashboardComponentParams;
	/* Metadata */
	public metadataService: SingleConnectionMetadataService;
	/* Connection */
	public connectionManagementService: SingleConnectionManagementService;
	/* Themeing */
	public themeService: IWorkbenchThemeService;
	/* Disaster Recovery */
	public adminService: SingleAdminService;

	constructor(
		@Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
		this.themeService = this._bootstrapService.themeService;
	 }

	 /**
	  * Set the selector for this dashboard instance, should only be set once
	  */
	public set selector(selector: string) {
		this._uniqueSelector = selector;
		this._getbootstrapParams();
	}

	private _getbootstrapParams(): void {
		this._bootstrapParams = this._bootstrapService.getBootstrapParams(this._uniqueSelector);
		this.uri = this._bootstrapParams.ownerUri;
	}

	/**
	 * Set the uri for this dashboard instance, should only be set once
	 * Inits all the services that depend on knowing a uri
	 */
	private set uri(uri: string) {
		this._uri = uri;
		this.metadataService = new SingleConnectionMetadataService(this._bootstrapService.metadataService, this._uri);
		this.connectionManagementService = new SingleConnectionManagementService(this._bootstrapService.connectionManagementService, this._uri);
		this.adminService = new SingleAdminService(this._bootstrapService.adminService, this._uri);
	}

	/**
	 * Creates a new query window based on the current conection
	 */
	public newQuery(): void {
		TaskUtilities.newQuery(
			this._bootstrapParams.connection.connectionProfile,
			this._bootstrapService.connectionManagementService,
			this._bootstrapService.queryEditorService);
	}

	/**
	 * Opens the Create database dialog for the current connection
	 */
	public createDatabase(): void {
		TaskUtilities.showCreateDatabase(
			this._uri,
			this._bootstrapParams.connection,
			this._bootstrapService.adminService,
			this._bootstrapService.errorMessageService,
			this._bootstrapService.partService);
	}

	/**
	 * Opens the backup dialog for the current connection
	 */
	public backup(): void {
		TaskUtilities.showBackup(
			this._uri,
			this._bootstrapParams.connection,
			this._bootstrapService.disasterRecoveryUiService);
	}
}
