/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Injectable, Inject } from '@angular/core';
import { Observable, Observer } from 'rxjs/Rx';
import { DashboardComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { IMetadataService } from 'sql/services/metadata/metadataService';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { TaskUtilities } from 'sql/common/taskUtilities';
import { IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';

import data = require('data');

/* Wrapper for a metadata service that contains the uri string to use on each request */
class SingleConnectionMetadataService {

	constructor(
		private _metadataService: IMetadataService,
		private _uri: string
	) { }

	get metadata(): Thenable<data.ProviderMetadata> {
		return this._metadataService.getMetadata(this._uri);
	}

	get databaseNames(): Thenable<string[]> {
		return this._metadataService.getDatabaseNames(this._uri);
	}
}

/* Wrapper for a connection service that contains the uri string to use on each request */
class SingleConnectionManagementService {

	constructor(
		private _connectionService: IConnectionManagementService,
		private _uri: string
	) { }

	public changeDatabase(name: string): Thenable<boolean> {
		return this._connectionService.changeDatabase(this._uri, name);
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

@Injectable()
export class BootstrapServiceWrapper {
	private _uniqueSelector: string;
	private _uri;
	private onThemeChangeObs: Observable<IColorTheme>;
	/* Bootstrap params*/
	private _bootstrapParams: DashboardComponentParams;
	private _bootstrapDeferred = new Deferred<DashboardComponentParams>();
	/* Metadata */
	private _metadataService: SingleConnectionMetadataService;
	private _metadataDeferred = new Deferred<data.ProviderMetadata>();
	private _databaseNamesDeferred = new Deferred<string[]>();
	/* Connection */
	private _connectionManagementService: SingleConnectionManagementService;
	private _connectionManagementDeferred = new Deferred<void>();


	constructor(@Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService) {
		let self = this;
		self.onThemeChangeObs = Observable.create((observer: Observer<IColorTheme>) => {
			self._bootstrapService.themeService.onDidColorThemeChange((e: IColorTheme) => {
				observer.next(e);
			});
		});
	 }

	get theme(): IColorTheme {
		return this._bootstrapService.themeService.getColorTheme();
	}

	public onThemeChange(cb: (e: IColorTheme) => void): void {
		this.onThemeChangeObs.subscribe((event: IColorTheme) => {
			cb(event);
		});
	}

	set selector(selector: string) {
		this._uniqueSelector = selector;
		this._getbootstrapParams();
		this._bootstrapDeferred.resolve(this._bootstrapParams);
	}

	set uri(uri: string) {
		this._uri = uri;
		/* resolve metadata promises */
		this._metadataService = new SingleConnectionMetadataService(this._bootstrapService.metadataService, this._uri);
		this._metadataDeferred.resolve(this._metadataService.metadata);
		this._databaseNamesDeferred.resolve(this._metadataService.databaseNames);
		/* resolve connection promises */
		this._connectionManagementService = new SingleConnectionManagementService(this._bootstrapService.connectionManagementService, this._uri);
		this._connectionManagementDeferred.resolve();
	}

	get bootstrapParams(): Promise<DashboardComponentParams> {
		return this._bootstrapDeferred.promise;
	}

	private _getbootstrapParams(): void {
		this._bootstrapParams = this._bootstrapService.getBootstrapParams(this._uniqueSelector);
		this.uri = this._bootstrapParams.ownerUri;
	}

	get metadata(): Promise<data.ProviderMetadata> {
		return this._metadataDeferred.promise;
	}

	get databaseNames(): Promise<string[]> {
		return this._databaseNamesDeferred.promise;
	}

	public changeDatabase(name: string): Promise<boolean> {
		let self = this;

		return new Promise<boolean>(resolve => {
			self._connectionManagementDeferred.promise.then(() => {
				resolve(self._connectionManagementService.changeDatabase(name));
			});
		});
	}

	public newQuery(): void {
		TaskUtilities.newQuery(
			this._bootstrapParams.connection.connectionProfile,
			this._bootstrapService.connectionManagementService,
			this._bootstrapService.queryEditorService);
	}

	public createDatabase(): void {
		TaskUtilities.showCreateDatabase(
			this._uri,
			this._bootstrapParams.connection,
			this._bootstrapService.adminService,
			this._bootstrapService.errorMessageService,
			this._bootstrapService.partService);
	}

	public backup(): void {
		TaskUtilities.showBackup(
			this._uri,
			this._bootstrapParams.connection,
			this._bootstrapService.disasterRecoveryService);
	}
}
