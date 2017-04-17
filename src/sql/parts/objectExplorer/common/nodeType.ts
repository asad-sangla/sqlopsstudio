/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

export class NodeType {
	public static Folder = 'Folder';
	public static Root = 'root';
	public static DatabaseInstance = 'DatabaseInstance';
	public static ServerInstance = 'ServerInstance';
	public static ScalarValuedFunctionInstance = 'ScalarValuedFunctionInstance';
	public static TableValuedFunctionInstance = 'TableValuedFunctionInstance';
	public static AggregateFunctionInstance = 'AggregateFunctionInstance';
	public static FileGroupInstance = 'FileGroupInstance';
	public static StoredProcedureInstance = 'StoredProcedureInstance';
	public static UserDefinedTableTypeInstance = 'UserDefinedTableTypeInstance';
	public static ViewInstance = 'ViewInstance';
	public static TableInstance = 'TableInstance';
	public static HistoryTableInstance = 'HistoryTableInstance';
	public static ExternalResourceInstance = 'ExternalResourceInstance';
	public static ExternalTableInstance = 'ExternalTableInstance';
}
