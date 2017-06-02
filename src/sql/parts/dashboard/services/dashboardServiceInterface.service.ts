/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Injectable, Inject } from '@angular/core';
import { Observable, Observer, Subject } from 'rxjs/Rx';
import { DashboardComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { IMetadataService } from 'sql/services/metadata/metadataService';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { TaskUtilities } from 'sql/common/taskUtilities';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
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

	public get connectionInfo(): ConnectionManagementInfo {
		return this._connectionService.getConnectionInfo(this._uri);
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
	private _uri;
	/* Themeing */
	private _onThemeChangeObs: Observable<IColorTheme>;
	/* Bootstrap params*/
	private _bootstrapParams: DashboardComponentParams;
	/* Metadata */
	private _metadataService: SingleConnectionMetadataService;
	private _metadataDeferred = new Deferred<data.ProviderMetadata>();
	private _databaseNamesDeferred = new Deferred<string[]>();
	/* Connection */
	private _connectionManagementService: SingleConnectionManagementService;
	private _connectionManagementDeferred = new Deferred<void>();
	private _connectionInfo: ConnectionManagementInfo;
	private _onConnectionChangeObs = new Subject<ConnectionManagementInfo>();

	constructor(@Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService) {
		let self = this;
		self._onThemeChangeObs = Observable.create((observer: Observer<IColorTheme>) => {
			self._bootstrapService.themeService.onDidColorThemeChange((e: IColorTheme) => {
				observer.next(e);
			});
		});
	 }

	 /**
	  * Set the selector for this dashboard instance, should only be set once
	  */
	set selector(selector: string) {
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

	/**
	 * Get the current theme of carbon
	 * @returns the theme
	 */
	get theme(): IColorTheme {
		return this._bootstrapService.themeService.getColorTheme();
	}

	/**
	 * Allows binding to on theme change for reactive themeing
	 * @param cb The function to call when a theme is changed
	 */
	public onThemeChange(cb: (e: IColorTheme) => void): void {
		this._onThemeChangeObs.subscribe((event: IColorTheme) => {
			cb(event);
		});
	}

	/**
	 * Get the current connection info
	 * @returns A promise that will resolve instantly if the connection info
	 * is already available or whenever the connectionManagementService has been init
	 */
	get connectionInfo(): Promise<ConnectionManagementInfo> {
		let self = this;
		if (self._connectionInfo) {
			return Promise.resolve(self._connectionInfo);
		} else {
			return new Promise<ConnectionManagementInfo>(resolve => {
				self._connectionManagementDeferred.promise.then(() => {
					self._connectionInfo = self._connectionManagementService.connectionInfo;
					self._onConnectionChangeObs.next(self._connectionInfo);
					resolve(self._connectionInfo);
				});
			});
		}
	}

	/**
	 * Allows binding onto when the connection for this uri changes
	 * @param cb The function to call on connection change
	 */
	public onConnectionChange(cb: (e: ConnectionManagementInfo) => void): void {
		this._onConnectionChangeObs.subscribe(connection => {
			cb(connection);
		});
	}

	/**
	 * Get the metadata for the current connection
	 * @returns A promise that resolves when the metadata is available
	 */
	get metadata(): Promise<data.ProviderMetadata> {
		return this._metadataDeferred.promise;
	}

	/**
	 * Get the database names for the current connection
	 * @returns A promise that resolves when the metadata service is available
	 */
	get databaseNames(): Promise<string[]> {
		return this._databaseNamesDeferred.promise;
	}

	/**
	 * Changes the database for the current connection and updates the connection info
	 * @param name Name of the database to change to
	 */
	public changeDatabase(name: string): Promise<boolean> {
		let self = this;

		return new Promise<boolean>(resolve => {
			self._connectionManagementDeferred.promise.then(() => {
				self._connectionManagementService.changeDatabase(name).then(result => {
					self._connectionInfo = self._connectionManagementService.connectionInfo;
					self._onConnectionChangeObs.next(self._connectionInfo);
					resolve(result);
				});
			});
		});
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
			this._bootstrapService.disasterRecoveryService);
	}
}
