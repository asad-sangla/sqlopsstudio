/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { $ } from 'vs/base/browser/dom';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { BootstrapParams } from 'sql/services/bootstrap/bootstrapParams';
import { IConnectionManagementService, IConnectionDialogService } from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/services/metadata/metadataService';
import { IObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { IAdminService } from 'sql/parts/admin/common/adminService';
import { IDisasterRecoveryService } from 'sql/parts/disasterRecovery/common/disasterRecoveryService';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';

export const BOOTSTRAP_SERVICE_ID: string = 'bootstrapService';
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
	adminService: IAdminService;
	disasterRecoveryService: IDisasterRecoveryService;
	keybindingService: IKeybindingService;
	contextKeyService: IContextKeyService;
	contextMenuService: IContextMenuService;

	/*
	* Bootstraps the Angular module described. Components that need singleton services should inject the
	* 'BootstrapService' dependency to obtain a reference to this class. Components that need dynamic parameters
	* should wrap them in an object and pass them in through the "params" parameter.
	*
	* moduleType:	 	The TypeScript type of the module to bootstrap
	* container: 		The HTML container to append the selector HTMLElement
	* selectorString: 	The tag name and class used to create the element, e.g. 'tagName.cssClassName'
	* params: 			The parameters to be associated with the given id
	*
	* Returns the unique selector string that this module will bootstrap with.
	*/
	bootstrap(moduleType: any, container: HTMLElement, selectorString: string, params: BootstrapParams): string;

	/*
	* Gets the "params" entry associated with the given id and unassociates the id/entry pair.
	* Returns undefined if no entry is found.
	*/
	getBootstrapParams(id: string): any;

	/*
	* Gets the next unique selector given the baseSelectorString. A unique selector is the baseSelectorString with a
	* number appended. E.g. if baseSelectorString='query', valid unique selectors could be query0, query1, query2, etc.
	*/
	getUniqueSelector(baseSelectorString: string): string;
}

export class BootstrapService implements IBootstrapService {

	public _serviceBrand: any;

	// Maps uniqueSelectors (as opposed to selectors) to BootstrapParams
	private _bootstrapParameterMap: Map<string, BootstrapParams>;

	// Maps selectors (as opposed to uniqueSelectors) to a queue of uniqueSelectors
	private _selectorQueueMap: Map<string, string[]>;

	// Maps selectors (as opposed to uniqueSelectors) to the next available uniqueSelector ID number
	private _selectorCountMap: Map<string, number>;

	constructor(
		@IConnectionManagementService public connectionManagementService: IConnectionManagementService,
		@IMetadataService public metadataService: IMetadataService,
		@IObjectExplorerService public objectExplorerService: IObjectExplorerService,
		@IScriptingService public scriptingService: IScriptingService,
		@IQueryEditorService public queryEditorService: IQueryEditorService,
		@IAdminService public adminService: IAdminService,
		@IDisasterRecoveryService public disasterRecoveryService: IDisasterRecoveryService,
		@IConnectionDialogService public connectionDialogService: IConnectionDialogService,
		@IQueryModelService public queryModelService: IQueryModelService,
		@IKeybindingService public keybindingService: IKeybindingService,
		@IContextKeyService public contextKeyService: IContextKeyService,
		@IContextMenuService public contextMenuService: IContextMenuService
	) {
		this._bootstrapParameterMap = new Map<string, BootstrapParams>();
		this._selectorQueueMap = new Map<string, string[]>();
		this._selectorCountMap = new Map<string, number>();
	}

	public bootstrap(moduleType: any, container: HTMLElement, selectorString: string, params: BootstrapParams): string {

		// Create the uniqueSelectorString
		let uniqueSelectorString: string = this._getUniqueSelectorString(selectorString);
		let selector: HTMLElement = $(uniqueSelectorString);
		container.appendChild(selector);

		// Associate the elementId
		this._setUniqueSelector(selectorString, uniqueSelectorString);

		// Associate the params
		this._bootstrapParameterMap.set(uniqueSelectorString, params);

		// Perform the bootsrap
		let providers = [{ provide: BOOTSTRAP_SERVICE_ID, useValue: this }];
		platformBrowserDynamic(providers).bootstrapModule(moduleType);

		return uniqueSelectorString;
	}

	public getBootstrapParams(id: string): any {
		let idLowercase = id.toLowerCase();
		let params: BootstrapParams = this._bootstrapParameterMap.get(idLowercase);
		this._bootstrapParameterMap.delete(idLowercase);
		return params;
	}

	public getUniqueSelector(selectorString: string): string {
		let idArray = this._selectorQueueMap.get(selectorString);
		if (!idArray) {
			return undefined;
		}

		let id: string = idArray.shift();

		if (idArray.length === 0) {
			this._selectorQueueMap.delete(selectorString);
		} else {
			this._selectorQueueMap.set(selectorString, idArray);
		}

		return id;
	}

	private _getUniqueSelectorString(selectorString: string): string {
		let count: number = this._selectorCountMap.get(selectorString);
		if (!count) {
			 this._selectorCountMap.set(selectorString, 1);
			 count = 0;
		} else {
			this._selectorCountMap.set(selectorString, count + 1);
		}
		let casedString = selectorString + count.toString();
		return casedString.toLowerCase();
	}

	private _setUniqueSelector(selectorString: string, elementId: string) {
		let idArray = this._selectorQueueMap.get(selectorString);
		if (!idArray) {
			idArray = [];
		}
		idArray.push(elementId);
		this._selectorQueueMap.set(selectorString, idArray);
	}
}