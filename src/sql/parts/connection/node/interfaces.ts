/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import vscode = require('vscode');
import data = require('data');
import * as Constants from 'sql/parts/connection/node/constants';

// interfaces
export enum ContentType {
	Root = 0,
	Messages = 1,
	ResultsetsMeta = 2,
	Columns = 3,
	Rows = 4,
	SaveResults = 5,
	Copy = 6,
	EditorSelection = 7,
	OpenLink = 8,
	ShowError = 9,
	ShowWarning = 10,
	Config = 11
};

export interface ISlickRange {
	fromCell: number;
	fromRow: number;
	toCell: number;
	toRow: number;
}

export enum AuthenticationTypes {
	Integrated = 1,
	SqlLogin = 2,
	ActiveDirectoryUniversal = 3
}

export const ContentTypes = [
	Constants.outputContentTypeRoot,
	Constants.outputContentTypeMessages,
	Constants.outputContentTypeResultsetMeta,
	Constants.outputContentTypeColumns,
	Constants.outputContentTypeRows,
	Constants.outputContentTypeSaveResults,
	Constants.outputContentTypeCopy,
	Constants.outputContentTypeEditorSelection,
	Constants.outputContentTypeOpenLink,
	Constants.outputContentTypeShowError,
	Constants.outputContentTypeShowWarning,
	Constants.outputContentTypeConfig
];

/**
 * Interface exposed to the user for creating new database connections.
 */
export interface IConnectionCredentials {
	/**
	 * server name
	 */
	server: string;

	/**
	 * database name
	 */
	database: string;

	/**
	 * user name
	 */
	user: string;

	/**
	 * password
	 */
	password: string;

	/**
	 * The port number to connect to.
	 */
	port: number;

	/**
	 * Gets or sets the authentication to use.
	 */
	authenticationType: string;

	/**
	 * Gets or sets a Boolean value that indicates whether SQL Server uses SSL encryption for all data sent between the client and server if
	 * the server has a certificate installed.
	 */
	encrypt: boolean;

	/**
	 * Gets or sets a value that indicates whether the channel will be encrypted while bypassing walking the certificate chain to validate trust.
	 */
	trustServerCertificate: boolean;

	/**
	 * Gets or sets a Boolean value that indicates if security-sensitive information, such as the password, is not returned as part of the connection
	 * if the connection is open or has ever been in an open state.
	 */
	persistSecurityInfo: boolean;

	/**
	 * Gets or sets the length of time (in seconds) to wait for a connection to the server before terminating the attempt and generating an error.
	 */
	connectTimeout: number;

	/**
	 * The number of reconnections attempted after identifying that there was an idle connection failure.
	 */
	connectRetryCount: number;

	/**
	 * Amount of time (in seconds) between each reconnection attempt after identifying that there was an idle connection failure.
	 */
	connectRetryInterval: number;

	/**
	 * Gets or sets the name of the application associated with the connection string.
	 */
	applicationName: string;

	/**
	 * Gets or sets the name of the workstation connecting to SQL Server.
	 */
	workstationId: string;

	/**
	 * Declares the application workload type when connecting to a database in an SQL Server Availability Group.
	 */
	applicationIntent: string;

	/**
	 * Gets or sets the SQL Server Language record name.
	 */
	currentLanguage: string;

	/**
	 * Gets or sets a Boolean value that indicates whether the connection will be pooled or explicitly opened every time that the connection is requested.
	 */
	pooling: boolean;

	/**
	 * Gets or sets the maximum number of connections allowed in the connection pool for this specific connection string.
	 */
	maxPoolSize: number;

	/**
	 * Gets or sets the minimum number of connections allowed in the connection pool for this specific connection string.
	 */
	minPoolSize: number;

	/**
	 * Gets or sets the minimum time, in seconds, for the connection to live in the connection pool before being destroyed.
	 */
	loadBalanceTimeout: number;

	/**
	 * Gets or sets a Boolean value that indicates whether replication is supported using the connection.
	 */
	replication: boolean;

	/**
	 * Gets or sets a string that contains the name of the primary data file. This includes the full path name of an attachable database.
	 */
	attachDbFilename: string;

	/**
	 * Gets or sets the name or address of the partner server to connect to if the primary server is down.
	 */
	failoverPartner: string;

	/**
	 * If your application is connecting to an AlwaysOn availability group (AG) on different subnets, setting MultiSubnetFailover=true
	 * provides faster detection of and connection to the (currently) active server.
	 */
	multiSubnetFailover: boolean;

	/**
	 * When true, an application can maintain multiple active result sets (MARS).
	 */
	multipleActiveResultSets: boolean;

	/**
	 * Gets or sets the size in bytes of the network packets used to communicate with an instance of SQL Server.
	 */
	packetSize: number;

	/**
	 * Gets or sets a string value that indicates the type system the application expects.
	 */
	typeSystemVersion: string;
}

// A Connection Profile contains all the properties of connection credentials, with additional
// optional name and details on whether password should be saved
export interface IConnectionProfile extends data.ConnectionInfo {
	savePassword: boolean;
	groupName: string;
	groupId: string;
	getUniqueId(): string;
	providerName: string;
};

export interface IConnectionProfileStore {
	options: {};
	groupId: string;
	providerName: string;
};

export enum CredentialsQuickPickItemType {
	Profile,
	Mru,
	NewConnection
};

export interface IConnectionCredentialsQuickPickItem extends vscode.QuickPickItem {
	connectionCreds: IConnectionCredentials;
	quickPickItemType: CredentialsQuickPickItemType;
};

// Obtained from an active connection to show in the status bar
export interface IConnectionProperties {
	serverVersion: string;
	currentUser: string;
	currentDatabase: string;
};

export interface IGridBatchMetaData {
	resultSets: data.IGridResultSet[];
	hasError: boolean;
	selection: data.ISelectionData;
	startTime: string;
	endTime: string;
	totalTime: string;
}

export interface IResultsConfig {
	shortcuts: { [key: string]: string };
	messagesDefaultOpen: boolean;
}

export interface ILogger {
	logDebug(message: string): void;
	increaseIndent(): void;
	decreaseIndent(): void;
	append(message?: string): void;
	appendLine(message?: string): void;
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IColumnDefinition, IObservableCollection, IGridDataRow } from 'angular2-slickgrid';

export enum FieldType {
	String = 0,
	Boolean = 1,
	Integer = 2,
	Decimal = 3,
	Date = 4,
	Unknown = 5
}

export interface IGridIcon {
	showCondition: () => boolean;
	icon: () => string;
	hoverText: () => string;
	functionality: (batchId: number, resultId: number, index: number) => void;
}

export interface IColumnDefinition {
	id?: string;
	name: string;
	type: FieldType;
	asyncPostRender?: (cellRef: string, row: number, dataContext: JSON, colDef: any) => void;
	formatter?: (row: number, cell: any, value: any, columnDef: any, dataContext: any) => string;
}

export interface IMessageLink {
	uri: string;
	text: string;
}

export interface IMessage {
	batchId?: number;
	time: string;
	message: string;
	isError: boolean;
	link?: IMessageLink;
}

export interface IGridIcon {
	showCondition: () => boolean;
	icon: () => string;
	hoverText: () => string;
	functionality: (batchId: number, resultId: number, index: number) => void;
}

export interface IResultsConfig {
	shortcuts: { [key: string]: string };
	messagesDefaultOpen: boolean;
}

/**
 * Simplified interface for a Range object returned by the Rangy javascript plugin
 *
 * @export
 * @interface IRange
 */
export interface IRange {
	selectNodeContents(el): void;
	/**
	 * Returns any user-visible text covered under the range, using standard HTML Range API calls
	 *
	 * @returns {string}
	 *
	 * @memberOf IRange
	 */
	toString(): string;
	/**
	 * Replaces the current selection with this range. Equivalent to rangy.getSelection().setSingleRange(range).
	 *
	 *
	 * @memberOf IRange
	 */
	select(): void;

	/**
	 * Returns the `Document` element containing the range
	 *
	 * @returns {Document}
	 *
	 * @memberOf IRange
	 */
	getDocument(): Document;

	/**
	 * Detaches the range so it's no longer tracked by Rangy using DOM manipulation
	 *
	 *
	 * @memberOf IRange
	 */
	detach(): void;

	/**
	 * Gets formatted text under a range. This is an improvement over toString() which contains unnecessary whitespac
	 *
	 * @returns {string}
	 *
	 * @memberOf IRange
	 */
	text(): string;
}

export interface IGridDataSet {
	dataRows: IObservableCollection<IGridDataRow>;
	columnDefinitions: IColumnDefinition[];
	resized: any; // EventEmitter<any>;
	totalRows: number;
	batchId: number;
	resultId: number;
	maxHeight: number | string;
	minHeight: number | string;
}

export interface IResultMessage {
	batchId?: number;
	isError: boolean;
	time: string;
	message: string;
}