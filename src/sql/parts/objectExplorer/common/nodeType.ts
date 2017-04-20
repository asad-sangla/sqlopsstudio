/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

export class NodeType {
	public static Folder = 'Folder';
	public static Root = 'root';
	public static DatabaseInstance = 'Database';
	public static ServerInstance = 'Server';
	public static ScalarValuedFunctionInstance = 'ScalarValuedFunction';
	public static TableValuedFunctionInstance = 'TableValuedFunction';
	public static AggregateFunctionInstance = 'AggregateFunction';
	public static FileGroupInstance = 'FileGroup';
	public static StoredProcedureInstance = 'StoredProcedure';
	public static UserDefinedTableTypeInstance = 'UserDefinedTableType';
	public static ViewInstance = 'View';
	public static TableInstance = 'Table';
	public static HistoryTableInstance = 'HistoryTable';
	public static ExternalResourceInstance = 'ExternalResource';
	public static ExternalTableInstance = 'ExternalTable';
}
