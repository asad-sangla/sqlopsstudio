/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'data' {
	import * as vscode from 'vscode';

	export interface ConnectionInfo {

		options: { [name: string]: any };
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
		/**
		 * Information about the connected server.
		 */
		serverInfo: ServerInfo;
		/**
		 * information about the actual connection established
		 */
		connectionSummary: ConnectionSummary;
	}

	/**
	 * Summary that identifies a unique database connection.
	 */
	export interface ConnectionSummary {
		/**
		 * server name
		 */
		serverName: string;
		/**
		 * database name
		 */
		databaseName: string;
		/**
		 * user name
		 */
		userName: string;
	}

	/**
	 * Information about a Server instance.
	 */
	export interface ServerInfo {
		/**
		 * The major version of the instance.
		 */
		serverMajorVersion: number;
		/**
		 * The minor version of the instance.
		 */
		serverMinorVersion: number;
		/**
		 * The build of the instance.
		 */
		serverReleaseVersion: number;
		/**
		 * The ID of the engine edition of the instance.
		 */
		engineEditionId: number;
		/**
		 * String containing the full server version text.
		 */
		serverVersion: string;
		/**
		 * String describing the product level of the server.
		 */
		serverLevel: string;
		/**
		 * The edition of the instance.
		 */
		serverEdition: string;
		/**
		 * Whether the instance is running in the cloud (Azure) or not.
		 */
		isCloud: boolean;
		/**
		 * The version of Azure that the instance is running on, if applicable.
		 */
		azureVersion: number;
		/**
		 * The Operating System version string of the machine running the instance.
		 */
		osVersion: string;
	}

	export interface ConnectionProvider {
		handle: number;

		connect(connectionUri: string, connectionInfo: ConnectionInfo): Thenable<boolean>;

		disconnect(connectionUri: string): Thenable<boolean>;

		cancelConnect(connectionUri: string): Thenable<boolean>;

		listDatabases(connectionUri: string): Thenable<ListDatabasesResult>;

		registerOnConnectionComplete(handler: (connSummary: ConnectionInfoSummary) => any);

		registerOnIntelliSenseCacheComplete(handler: (connectionUri: string) => any);

		registerOnConnectionChanged(handler: (changedConnInfo: ChangedConnectionInfo) => any);
	}

	export enum ServiceOptionType {
		string = 0,
		multistring = 1,
		password = 2,
		number = 3,
		category = 4,
		boolean = 5,
		object = 6
	}

	export enum ConnectionOptionSpecialType {
		serverName = 0,
		databaseName = 1,
		authType = 2,
		userName = 3,
		password = 4,
		appName = 5
	}

	export interface CategoryValue {
		displayName: string;
		name: string;
	}

	export interface ConnectionOption {
		name: string;

		displayName: string;

		description: string;

		groupName: string;

		valueType: ServiceOptionType;

		specialValueType: ConnectionOptionSpecialType;

		defaultValue: string;

		categoryValues: CategoryValue[];

		isIdentity: boolean;

		isRequired: boolean;
	}

	export interface ConnectionProviderOptions {
		options: ConnectionOption[];
	}

	export interface ServiceOption {
		name: string;

		displayName: string;

		description: string;

		groupName: string;

		valueType: ServiceOptionType;

		defaultValue: string;

		objectType: string;

		categoryValues: CategoryValue[];

		isRequired: boolean;

		isArray: boolean;
	}

	export interface AdminServicesOptions {
		databaseInfoOptions: ServiceOption[];

		databaseFileInfoOptions: ServiceOption[];

		fileGroupInfoOptions: ServiceOption[];
	}


	// List Databases Request ----------------------------------------------------------------------
	export interface ListDatabasesResult {
		databaseNames: Array<string>;
	}

	/**
	 * Information about a connection changed event for a resource represented by a URI
	 */
	export interface ChangedConnectionInfo {
		/**
		 * Owner URI of the connection that changed.
		 */
		connectionUri: string;

		/**
		 * Summary of details containing any connection changes.
		 */
		connection: ConnectionSummary;
	}

	export interface DataProtocolServerCapabilities {
		protocolVersion: string;

		providerName: string;

		providerDisplayName: string;

		connectionProvider: ConnectionProviderOptions;

		adminServicesProvider: AdminServicesOptions;
	}

	export interface DataProtocolClientCapabilities {
		hostName: string;

		hostVersion: string;
	}

	export interface CapabilitiesProvider {
		getServerCapabilities(client: DataProtocolClientCapabilities): Thenable<DataProtocolServerCapabilities>
	}

	export enum MetadataType {
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

	export interface ColumnMetadata {

		hasExtendedProperties: boolean;

		defaultValue: string;

		/// <summary>
		/// Escaped identifier for the name of the column
		/// </summary>
		escapedName: string;

		/// <summary>
		/// Whether or not the column is computed
		/// </summary>
		isComputed: boolean;

		/// <summary>
		/// Whether or not the column is deterministically computed
		/// </summary>
		isDeterministic: boolean;

		/// <summary>
		/// Whether or not the column is an identity column
		/// </summary>
		isIdentity: boolean;

		/// <summary>
		/// The ordinal ID of the column
		/// </summary>
		ordinal: number;

		/// <summary>
		/// Whether or not the column is calculated on the server side. This could be a computed
		/// column or a identity column.
		/// </summary>
		isCalculated: boolean;

		/// <summary>
		/// Whether or not the column is used in a key to uniquely identify a row
		/// </summary>
		isKey: boolean;

		/// <summary>
		/// Whether or not the column can be trusted for uniqueness
		/// </summary>
		isTrustworthyForUniqueness: boolean;
	}

	export interface TableMetadata {

		columns: ColumnMetadata;

	}

	export interface ProviderMetadata {
		objectMetadata: ObjectMetadata[];
	}

	export interface MetadataProvider {
		getMetadata(connectionUri: string): Thenable<ProviderMetadata>;

		getDatabases(connectionUri: string): Thenable<string[]>;

		getTableInfo(connectionUri: string, metadata: ObjectMetadata): Thenable<ColumnMetadata[]>;

		getViewInfo(connectionUri: string, metadata: ObjectMetadata): Thenable<ColumnMetadata[]>;
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

		providerId: string;

		capabilitiesProvider: CapabilitiesProvider;

		connectionProvider: ConnectionProvider;

		queryProvider: QueryProvider;

		metadataProvider: MetadataProvider;

		scriptingProvider: ScriptingProvider;

		objectExplorerProvider: ObjectExplorerProvider;

		adminServicesProvider: AdminServicesProvider;

		disasterRecoveryProvider: DisasterRecoveryProvider;

		taskServicesProvider: TaskServicesProvider;
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


	export interface DidChangeLanguageFlavorParams {
		uri: string;
		language: string;
		flavor: string;
	}

	/**
	 * Namespace for Data Management Protocol global methods
	 */
	export namespace dataprotocol {
		export function registerProvider(provider: DataProtocolProvider): vscode.Disposable;

		/**
		 * An [event](#Event) which fires when the specific flavor of a language used in DMP
		 * connections has changed. And example is for a SQL connection, the flavor changes
		 * to MSSQL or PGSQL
		 */
		export const onDidChangeLanguageFlavor: vscode.Event<DidChangeLanguageFlavorParams>;
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
		runQueryStatement(ownerUri: string, line: number, column: number): Thenable<void>;
		runQueryString(ownerUri: string, queryString: string): Thenable<void>;
		runQueryAndReturn(ownerUri: string, queryString: string): Thenable<SimpleExecuteResult>;
		getQueryRows(rowData: QueryExecuteSubsetParams): Thenable<QueryExecuteSubsetResult>;
		disposeQuery(ownerUri: string): Thenable<void>;
		saveResults(requestParams: SaveResultsRequestParams): Thenable<SaveResultRequestResult>;

		// Notifications
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
		initializeEdit(ownerUri: string, schemaName: string, objectName: string, objectType: string, rowLimit: number): Thenable<void>;
		revertCell(ownerUri: string, rowId: number, columnId: number): Thenable<EditRevertCellResult>;
		revertRow(ownerUri: string, rowId: number): Thenable<void>;
		updateCell(ownerUri: string, rowId: number, columnId: number, newValue: string): Thenable<EditUpdateCellResult>;
		getEditRows(rowData: EditSubsetParams): Thenable<EditSubsetResult>;

		// Edit Data Notifications
		registerOnEditSessionReady(handler: (ownerUri: string, success: boolean, message: string) => any): void;
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

	export enum EditRowState {
		clean = 0,
		dirtyInsert = 1,
		dirtyDelete = 2,
		dirtyUpdate = 3
	}

	export interface EditRow {
		cells: DbCellValue[];
		id: number;
		isDirty: boolean;
		state: EditRowState;
	}

	export interface EditCell extends DbCellValue {
		isDirty: boolean;
	}

	export interface QueryExecuteCompleteNotificationResult {
		ownerUri: string;
		batchSummaries: BatchSummary[];
	}

	export interface SimpleExecuteParams {
		queryString: string;
		ownerUri: string;
	}

	export interface SimpleExecuteResult {
		rowCount: number;
		columnInfo: IDbColumn[];
		rows: DbCellValue[][];
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

	export interface DbCellValue {
		displayValue: string;
		isNull: boolean;
	}

	export interface ResultSetSubset {
		rowCount: number;
		rows: DbCellValue[][];
	}

	export interface QueryExecuteSubsetResult {
		resultSubset: ResultSetSubset;
	}

	export interface QueryCancelResult {
		messages: string;
	}

	// Save Results ===============================================================================
	export interface SaveResultsRequestParams {
		/**
		 * 'csv', 'json', 'excel'
		 */
		resultFormat: string;
		ownerUri: string;
		filePath: string;
		batchIndex: number;
		resultSetIndex: number;
		rowStartIndex: number;
		rowEndIndex: number;
		columnStartIndex: number;
		columnEndIndex: number;
		includeHeaders?: boolean;
	}

	export interface SaveResultRequestResult {
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

	export interface EditCellResult {
		cell: EditCell;
		isRowDirty: boolean;
	}

	// edit/commit --------------------------------------------------------------------------------
	export interface EditCommitParams extends IEditSessionOperationParams { }
	export interface EditCommitResult { }

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
	export interface EditInitializeFiltering {
		LimitResults?: number;
	}
	export interface EditInitializeParams extends IEditSessionOperationParams {
		filters: EditInitializeFiltering;
		objectName: string;
		objectType: string;
	}

	export interface EditInitializeResult { }

	// edit/revertCell ----------------------------------------------------------------------------
	export interface EditRevertCellParams extends IEditRowOperationParams {
		columnId: number;
	}
	export interface EditRevertCellResult extends EditCellResult {
	}

	// edit/revertRow -----------------------------------------------------------------------------
	export interface EditRevertRowParams extends IEditRowOperationParams { }
	export interface EditRevertRowResult { }

	// edit/sessionReady Event --------------------------------------------------------------------
	export interface EditSessionReadyParams {
		ownerUri: string;
		success: boolean;
		message: string;
	}

	// edit/updateCell ----------------------------------------------------------------------------
	export interface EditUpdateCellParams extends IEditRowOperationParams {
		columnId: number;
		newValue: string;
	}

	export interface EditUpdateCellResult extends EditCellResult {
	}

	// edit/subset --------------------------------------------------------------------------------
	export interface EditSubsetParams extends IEditSessionOperationParams {
		rowStartIndex: number;
		rowCount: number;
	}
	export interface EditSubsetResult {
		rowCount: number;
		subset: EditRow[];
	}

	export interface NodeInfo {
		nodePath: string;
		nodeType: string;
		nodeSubType: string;
		nodeStatus: string;
		label: string;
		isLeaf: boolean;
		metadata: ObjectMetadata;
		errorMessage: string;
	}

	// Object Explorer interfaces  -----------------------------------------------------------------------
	export interface ObjectExplorerSession {
		success: boolean;
		sessionId: string;
		rootNode: NodeInfo;
		errorMessage: string;
	}

	export interface ObjectExplorerSessionResponse {
		sessionId: string;
	}

	export interface ObjectExplorerExpandInfo {
		sessionId: string;
		nodePath: string;
		nodes: NodeInfo[];
		errorMessage: string;
	}

	export interface ExpandNodeInfo {
		sessionId: string,
		nodePath: string,
	}

	export interface ObjectExplorerCloseSessionInfo {
		sessionId: string
	}

	export interface ObjectExplorerCloseSessionResponse {
		sessionId: string;
		success: boolean;
	}

	export interface ObjectExplorerProvider {
		createNewSession(connInfo: ConnectionInfo): Thenable<ObjectExplorerSessionResponse>;

		expandNode(nodeInfo: ExpandNodeInfo): Thenable<boolean>;

		refreshNode(nodeInfo: ExpandNodeInfo): Thenable<boolean>;

		closeSession(closeSessionInfo: ObjectExplorerCloseSessionInfo): Thenable<ObjectExplorerCloseSessionResponse>;

		registerOnSessionCreated(handler: (response: ObjectExplorerSession) => any);

		registerOnExpandCompleted(handler: (response: ObjectExplorerExpandInfo) => any);

	}

	// Admin Services interfaces  -----------------------------------------------------------------------
	export interface DatabaseInfo {
		options: {};
	}

	export interface LoginInfo {
		name: string;
	}

	export interface CreateDatabaseResponse {
		result: boolean;
		taskId: number;
	}

	export interface CreateLoginResponse {
		result: boolean;
		taskId: number;
	}

	export interface AdminServicesProvider {
		createDatabase(connectionUri: string, database: DatabaseInfo): Thenable<CreateDatabaseResponse>;

		createLogin(connectionUri: string, login: LoginInfo): Thenable<CreateLoginResponse>;

		getDefaultDatabaseInfo(connectionUri: string): Thenable<DatabaseInfo>;

		getDatabaseInfo(connectionUri: string): Thenable<DatabaseInfo>;
	}

	// Task service interfaces ----------------------------------------------------------------------------
	export enum TaskStatus {
		notStarted = 0,
		inProgress = 1,
		succeeded = 2,
		succeededWithWarning = 3,
		failed = 4,
		canceled = 5
	}

	export interface ListTasksParams {
		listActiveTasksOnly: boolean;
	}

	export interface TaskInfo {
		taskId: string;
		status: TaskStatus;
		serverName: string;
		databaseName: string;
		name: string;
		description: string;
		providerName: string;
	}

	export interface ListTasksResponse {
		tasks: TaskInfo[];
	}

	export interface CancelTaskParams {
		taskId: string;
	}

	export interface TaskProgressInfo {
		taskId: string;
		status: TaskStatus;
		message: string;
		duration: number;
	}

	export interface TaskServicesProvider {
		getAllTasks(listTasksParams: ListTasksParams): Thenable<ListTasksResponse>;

		cancelTask(cancelTaskParams: CancelTaskParams): Thenable<boolean>;

		registerOnTaskCreated(handler: (response: TaskInfo) => any);

		registerOnTaskStatusChanged(handler: (response: TaskProgressInfo) => any);
	}

	// Disaster Recovery interfaces  -----------------------------------------------------------------------

	export interface BackupConfigInfo {
		databaseInfo: {};
		recoveryModel: string;
		latestBackups: {};
		defaultBackupFolder: string;
		backupEncryptors: {};
	}

	export interface BackupInfo {
		ownerUri: string;

		databaseName: string;

		backupType: number;

		backupComponent: number;

		backupDeviceType: number;

		selectedFiles: string;

		backupsetName: string;

		selectedFileGroup: { [path: string]: string };

		// List of {key: backup path, value: device type}
		backupPathDevices: { [path: string]: number };

		backupPathList: [string];

		isCopyOnly: boolean;

		formatMedia: boolean;

		initialize: boolean;

		skipTapeHeader: boolean;

		mediaName: string;

		mediaDescription: string;

		checksum: boolean;

		continueAfterError: boolean;

		logTruncation: boolean;

		tailLogBackup: boolean;

		retainDays: number;

		compressionOption: number;

		verifyBackupRequired: boolean;

		encryptionAlgorithm: number;

		encryptorType: number;

		encryptorName: string;
	}

	export interface BackupResponse {
		result: boolean;
		taskId: number;
	}

	export interface DisasterRecoveryProvider {
		backup(connectionUri: string, backupInfo: BackupInfo): Thenable<BackupResponse>;
		getBackupConfigInfo(connectionUri: string): Thenable<BackupConfigInfo>;
		getRestorePlan(connectionUri: string, restoreInfo: RestoreInfo): Thenable<RestorePlanResponse>;
		restore(connectionUri: string, restoreInfo: RestoreInfo): Thenable<RestoreResponse>;
	}

	export interface RestoreInfo {
		options: {};
	}

	export interface RestoreDatabaseFileInfo {
		fileType: string;

		logicalFileName: string;

		originalFileName: string;

		restoreAsFileName: string;
	}

	export interface RestorePlanResponse {
		sessionId: string;
		canRestore: boolean;
		errorMessage: string;
		dbFiles: RestoreDatabaseFileInfo[];
		serverName: string;
		databaseName: string;
		relocateFilesNeeded: boolean;
		defaultDataFolder: string;
		defaultLogFolder: string;
	}

	export interface RestoreResponse {
		result: boolean;
		taskId: string;
		errorMessage: string;
	}
}
