/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'data' {
	import * as vscode from 'vscode';

	export interface ConnectionInfo {
		serverName: string;

		databaseName: string;

		userName: string;

		password: string;

		authenticationType: string;
	}

	export interface ConnectionInfoSummary {
		/**
		 * URI identifying the owner of the connection
		 */
		ownerUri: string;

		/**
		 * connection id returned from service host.
		 */
		connectionId: string;

		/**
		 * any diagnostic messages return from the service host.
		 */
		messages: string;

		/**
		 * Error message returned from the engine, if any.
		 */
		errorMessage: string;

		/**
		 * Error number returned from the engine, if any.
		 */
		errorNumber: number;
	}

	export interface ConnectionProvider {
		handle: number;

		connect(connectionUri: string, connectionInfo: ConnectionInfo): Thenable<boolean>;

		disconnect(connectionUri: string): Thenable<boolean>;

		cancelConnect(connectionUri: string): Thenable<boolean>;

		registerOnConnectionComplete(handler: (connSummary: ConnectionInfoSummary) => any);

		registerOnIntelliSenseCacheComplete(handler: (connectionUri: string) => any);
	}

	export enum ConnectionOptionType {
		string = 0,
		multistring = 1,
		password = 2,
		number = 3,
		category = 4,
		boolean = 5
	}

	export enum ConnectionOptionSpecialType {
		serverName = 0,
		databaseName = 1,
		authType = 2,
		userName = 3,
		password = 4
	}

	export interface ConnectionOption {
		name: string;

		displayName: string;

		description: string;

		groupName: string;

		valueType: ConnectionOptionType;

		specialValueType: ConnectionOptionSpecialType;

		defaultValue: string;

		categoryValues: string[];

		isIdentity: boolean;

		isRequired: boolean;
	}

	export interface ConnectionProviderOptions  {
		options: ConnectionOption[];
	}

	export interface DataProtocolServerCapabilities {
		protocolVersion: string;

		providerName: string;

		providerDisplayName: string;

		connectionProvider: ConnectionProviderOptions;
	}

	export interface DataProtocolClientCapabilities {
		hostName: string;

		hostVersion: string;
	}

	export interface CapabilitiesProvider {
		getServerCapabilities(client: DataProtocolClientCapabilities): Thenable<DataProtocolServerCapabilities>
	}

	export enum MetadataType
	{
		Table = 0,
		View = 1,
		SProc = 2,
		Function = 3
	}

	export interface ObjectMetadata {
		metadataType: MetadataType;

		metadataTypeName: string;

		name: string;

		schema: string;
	}

	export interface ProviderMetadata {
		objectMetadata: ObjectMetadata[];
	}

	export interface MetadataProvider {
		getMetadata(connectionUri: string): Thenable<ProviderMetadata>;
	}

	export interface ScriptingResult {
		objectName: string;

		script: string;
	}

	export interface ScriptingProvider {
		scriptAsSelect(connectionUri: string, metadata: ObjectMetadata): Thenable<ScriptingResult>;

		scriptAsCreate(connectionUri: string, metadata: ObjectMetadata): Thenable<ScriptingResult>;

		scriptAsInsert(connectionUri: string, metadata: ObjectMetadata): Thenable<ScriptingResult>;

		scriptAsUpdate(connectionUri: string, metadata: ObjectMetadata): Thenable<ScriptingResult>;

		scriptAsDelete(connectionUri: string, metadata: ObjectMetadata): Thenable<ScriptingResult>;
	}

	/**
	 * Data Management Protocol main provider class that DMP extensions should implement.
	 * This provider interface contains references to providers for the various capabilitiesProvider
	 * that an extension can implement.
	 */
	export interface DataProtocolProvider {
		handle: number;

		capabilitiesProvider: CapabilitiesProvider;

		connectionProvider: ConnectionProvider;

		queryProvider: QueryProvider;

		metadataProvider: MetadataProvider;

		scriptingProvider: ScriptingProvider;
	}

	/**
	 * Parameters to initialize a connection to a database
	 */
	export interface Credential {
		/**
		 * Unique ID identifying the credential
		 */
		credentialId: string;

		/**
		 * password
		 */
		password: string;
	}

	export interface CredentialProvider {
		handle: number;

		saveCredential(credentialId: string, password: string): Thenable<boolean>;

		readCredential(credentialId: string): Thenable<Credential>;

    	deleteCredential(credentialId: string): Thenable<boolean>;
	}

	/**
	 * Namespace for Data Management Protocol global methods
	 */
	export namespace dataprotocol {
		export function registerProvider(provider: DataProtocolProvider): vscode.Disposable;
	}

	/**
	 * Namespace for credentials management global methods
	 */
	export namespace credentials {
		export function registerProvider(provider: CredentialProvider): vscode.Disposable;
	}

	export interface QueryProvider {
		handle: number;
		// TODO replace this temporary queryType field to detect "MSSQL" vs "PostGre" with a standard definition for supported platform
		queryType: string;
		cancelQuery(ownerUri: string): Thenable<QueryCancelResult>;
		runQuery(ownerUri: string, selection: ISelectionData): Thenable<void>;
		getQueryRows(rowData: QueryExecuteSubsetParams): Thenable<QueryExecuteSubsetResult>;
		disposeQuery(ownerUri: string): Thenable<void>;

		registerOnQueryComplete(handler: (result: QueryExecuteCompleteNotificationResult) => any): void;
		registerOnBatchStart(handler: (batchInfo: QueryExecuteBatchNotificationParams) => any): void;
		registerOnBatchComplete(handler: (batchInfo: QueryExecuteBatchNotificationParams) => any): void;
		registerOnResultSetComplete(handler: (resultSetInfo: QueryExecuteResultSetCompleteNotificationParams) => any): void;
		registerOnMessage(handler: (message: QueryExecuteMessageParams) => any): void;

		// Edit Data Requests
		commitEdit(ownerUri: string): Thenable<void>;
		createRow(ownerUri: string): Thenable<EditCreateRowResult>;
		deleteRow(ownerUri: string, rowId: number): Thenable<void>;
		disposeEdit(ownerUri: string): Thenable<void>;
		initializeEdit(ownerUri: string, objectName: string, objectType: string): Thenable<void>;
		revertCell(ownerUri: string, rowId: number, columnId: number): Thenable<EditRevertCellResult>;
		revertRow(ownerUri: string, rowId: number): Thenable<void>;
		updateCell(ownerUri: string, rowId: number, columnId: number, newValue: string): Thenable<EditUpdateCellResult>;

		// Edit Data Notifications
		registerOnEditSessionReady(handler: (ownerUri: string, success: boolean) => any): void;
	}

	export interface IDbColumn {
		allowDBNull?: boolean;
		baseCatalogName: string;
		baseColumnName: string;
		baseSchemaName: string;
		baseServerName: string;
		baseTableName: string;
		columnName: string;
		columnOrdinal?: number;
		columnSize?: number;
		isAliased?: boolean;
		isAutoIncrement?: boolean;
		isExpression?: boolean;
		isHidden?: boolean;
		isIdentity?: boolean;
		isKey?: boolean;
		isBytes?: boolean;
		isChars?: boolean;
		isSqlVariant?: boolean;
		isUdt?: boolean;
		dataType: string;
		isXml?: boolean;
		isJson?: boolean;
		isLong?: boolean;
		isReadOnly?: boolean;
		isUnique?: boolean;
		numericPrecision?: number;
		numericScale?: number;
		udtAssemblyQualifiedName: string;
		dataTypeName: string;
	}

	export interface IGridResultSet {
		columns: IDbColumn[];
		rowsUri: string;
		numberOfRows: number;
	}

	export interface IResultMessage {
		batchId?: number;
		isError: boolean;
		time: string;
		message: string;
	}

	export interface ISelectionData {
		startLine: number;
		startColumn: number;
		endLine: number;
		endColumn: number;
	}


	export interface ResultSetSummary {
		id: number;
		batchId: number;
		rowCount: number;
		columnInfo: IDbColumn[];
	}

	export interface BatchSummary {
		hasError: boolean;
		id: number;
		selection: ISelectionData;
		resultSetSummaries: ResultSetSummary[];
		executionElapsed: string;
		executionEnd: string;
		executionStart: string;
	}

	export interface QueryExecuteCompleteNotificationResult {
		ownerUri: string;
		batchSummaries: BatchSummary[];
	}

	// Query Batch Notification -----------------------------------------------------------------------
	export interface QueryExecuteBatchNotificationParams {
		batchSummary: BatchSummary;
		ownerUri: string;
	}


	export interface QueryExecuteResultSetCompleteNotificationParams {
		resultSetSummary: ResultSetSummary;
		ownerUri: string;
	}


	export interface QueryExecuteMessageParams {
		message: IResultMessage;
		ownerUri: string;
	}

	export interface QueryExecuteParams {
		ownerUri: string;
		querySelection: ISelectionData;
	}

	export interface QueryExecuteSubsetParams {
		ownerUri: string;
		batchIndex: number;
		resultSetIndex: number;
		rowsStartIndex: number;
		rowsCount: number;
	}

	export interface ResultSetSubset {
		rowCount: number;
		rows: any[][];
	}

	export interface QueryExecuteSubsetResult {
		message: string;
		resultSubset: ResultSetSubset;
	}

	export interface QueryCancelResult {
		messages: string;
	}

	// Edit Data ==================================================================================
	// Shared Interfaces --------------------------------------------------------------------------
	export interface IEditSessionOperationParams {
		ownerUri: string;
	}

	export interface IEditRowOperationParams extends IEditSessionOperationParams {
		rowId: number;
	}

	// edit/commit --------------------------------------------------------------------------------
	export interface EditCommitParams extends IEditSessionOperationParams {	}
	export interface EditCommitResult {}

	// edit/createRow -----------------------------------------------------------------------------
	export interface EditCreateRowParams extends IEditSessionOperationParams { }
	export interface EditCreateRowResult {
		defaultValues: string[];
		newRowId: number;
	}

	// edit/deleteRow -----------------------------------------------------------------------------
	export interface EditDeleteRowParams extends IEditRowOperationParams { }
	export interface EditDeleteRowResult { }

	// edit/dispose -------------------------------------------------------------------------------
	export interface EditDisposeParams extends IEditSessionOperationParams { }
	export interface EditDisposeResult { }

	// edit/initialize ----------------------------------------------------------------------------
	export interface EditInitializeParams extends IEditSessionOperationParams {
		objectName: string;
		objectType: string;
	}

	export interface EditInitializeResult { }

	// edit/revertCell ----------------------------------------------------------------------------
	export interface EditRevertCellParams extends IEditRowOperationParams {
		columnId: number;
	}
	export interface EditRevertCellResult {
		newValue: string;
	}

	// edit/revertRow -----------------------------------------------------------------------------
	export interface EditRevertRowParams extends IEditRowOperationParams { }
	export interface EditRevertRowResult { }

	// edit/sessionReady Event --------------------------------------------------------------------
	export interface EditSessionReadyParams {
		ownerUri: string;
		success: boolean;
	}

	// edit/updateCell ----------------------------------------------------------------------------
	export interface EditUpdateCellParams extends IEditRowOperationParams {
		columnId: number;
		newValue: string;
	}

	export interface EditUpdateCellResult {
		hasCorrections: boolean;
		isNull: boolean;
		isRevert: boolean;
		newValue: string;
	}
}
