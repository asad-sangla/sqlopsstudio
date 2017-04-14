/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { append, $ } from 'vs/base/browser/dom';

import { BootstrapParams } from 'sql/parts/bootstrap/bootstrapParams';
import { IConnectionManagementService, IConnectionDialogService } from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IObjectExplorerService } from 'sql/parts/objectExplorer/common/objectExplorerService';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';

declare let AngularPlatformBrowserDynamic;

export const BOOTSTRAP_SERVICE_ID = 'bootstrapService';

export const IBootstrapService = createDecorator<IBootstrapService>(BOOTSTRAP_SERVICE_ID);

/*
 * Handles logic for bootstrapping and passing singleton services to Angular components.
 */
export interface IBootstrapService {

	_serviceBrand: any;

	connectionManagementService: IConnectionManagementService;
	metadataService: IMetadataService;
	objectExplorerService: IObjectExplorerService;
	scriptingService: IScriptingService;
	queryEditorService: IQueryEditorService;
	connectionDialogService: IConnectionDialogService;
	queryModelService: IQueryModelService;

	/*
	* Bootstraps the Angular module described. Components that need singleton services should inject the
	* 'BootstrapService' dependency to obtain a reference to this class. Components that need dynamic parameters
	* should wrap them in an object and pass them in through the "params" parameter.
	*
	* moduleType:	 	The TypeScript type of the module to bootstrap
	* container: 		The HTML container to append the selector HTMLElement
	* selectorString: 	The tag name and class used to create the element, e.g. 'tagName.cssClassName'
	* id: 				The id given to the created selector element. Used for this component to uniquely identify itself
	* params: 			The parameters to be associated with the given id
	*/
	bootstrap(moduleType: any, container: HTMLElement, selectorString: string, id: string, params: BootstrapParams): void;

	/*
	* Get the "params" entry previously associated with the given id and unassociates the id and the entry.
	* Returns undefined if no entry is found.
	*/
	getBootstrapParams(id: string): any;
}

export class BootstrapService implements IBootstrapService {

	public _serviceBrand: any;
	private _bootstrapParameterMap: Map<string, BootstrapParams>;

	constructor(
		@IConnectionManagementService public connectionManagementService: IConnectionManagementService,
		@IMetadataService public metadataService: IMetadataService,
		@IObjectExplorerService public objectExplorerService: IObjectExplorerService,
		@IScriptingService public scriptingService: IScriptingService,
		@IQueryEditorService public queryEditorService: IQueryEditorService,
		@IConnectionDialogService public connectionDialogService: IConnectionDialogService,
		@IQueryModelService public queryModelService: IQueryModelService,
	) {
		this._bootstrapParameterMap = new Map<string, BootstrapParams>();
	}

	public bootstrap(moduleType: any, container: HTMLElement, selectorString: string, id: string, params: BootstrapParams): void {

		// Set the selector and HTML element
		let selector: HTMLElement = $(selectorString);
		selector.id = id;
		append(container, selector);

		container.setAttribute('bootstrap-id', id);

		// Associate the params
		this._bootstrapParameterMap[id] = params;

		// Perform the bootsrap
		let providers = [{ provide: BOOTSTRAP_SERVICE_ID, useValue: this }];
		AngularPlatformBrowserDynamic.platformBrowserDynamic(providers).bootstrapModule(moduleType);
	}

	getBootstrapParams(id: string): any {
		let params = this._bootstrapParameterMap[id];
		this._bootstrapParameterMap[id] = undefined;
		return params;
	}
}