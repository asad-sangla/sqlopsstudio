/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import data = require('data');
import * as Constants from 'sql/parts/connection/common/constants';

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

// A Connection Profile contains all the properties of connection credentials, with additional
// optional name and details on whether password should be saved
export interface IConnectionProfile extends data.ConnectionInfo {
	serverName: string;
	databaseName: string;
	userName: string;
	password: string;
	authenticationType: string;
	savePassword: boolean;
	groupFullName: string;
	groupId: string;
	getUniqueId(): string;
	providerName: string;
	saveProfile: boolean;
};

export interface IConnectionProfileStore {
	options: {};
	groupId: string;
	providerName: string;
	savePassword: boolean;
};

export enum CredentialsQuickPickItemType {
	Profile,
	Mru,
	NewConnection
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
	isEditable?: boolean;
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