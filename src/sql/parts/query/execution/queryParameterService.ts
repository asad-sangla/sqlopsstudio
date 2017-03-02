/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DataService } from 'sql/parts/grid/services/dataService';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';

/**
 * Used to pass parameters that are unique to different instances of AppComponent, working
 * around the fact that Angular injections are treated as singletons.
 */
export class QueryParameterService implements IQueryParameterService  {
	dataService: DataService;
}

export interface IQueryParameterService  {
	dataService: DataService;
}

export const SERVICE_ID = 'queryParameterService';

export const IQueryParameterService  = createDecorator<IQueryParameterService >(SERVICE_ID);
