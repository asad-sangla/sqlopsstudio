/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';

import { BootstrapParams } from 'sql/services/bootstrap/bootstrapParams';
import { IConnectionManagementService, IConnectionDialogService, IErrorMessageService }
	from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/services/metadata/metadataService';
import { IObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { IAdminService } from 'sql/parts/admin/common/adminService';
import { IDisasterRecoveryService, IDisasterRecoveryUiService } from 'sql/parts/disasterRecovery/common/interfaces';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IWorkbenchThemeService } from 'vs/workbench/services/themes/common/workbenchThemeService';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { IEditorInput } from 'vs/platform/editor/common/editor';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IAngularEventingService } from 'sql/services/angularEventing/angularEventingService';

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
	disasterRecoveryUiService: IDisasterRecoveryUiService;
	keybindingService: IKeybindingService;
	contextKeyService: IContextKeyService;
	contextMenuService: IContextMenuService;
	themeService: IWorkbenchThemeService;
	errorMessageService: IErrorMessageService;
	partService: IPartService;
	instantiationService: IInstantiationService;
	angularEventingService: IAngularEventingService;

	/*
	* Bootstraps the Angular module described. Components that need singleton services should inject the
	* 'BootstrapService' dependency to obtain a reference to this class. Components that need dynamic parameters
	* should wrap them in an object and pass them in through the "params" parameter.
	*
	* moduleType:	 	The TypeScript type of the module to bootstrap
	* container: 		The HTML container to append the selector HTMLElement
	* selectorString: 	The tag name and class used to create the element, e.g. 'tagName.cssClassName'
	* params: 			The parameters to be associated with the given id
	* input:            Optional editor input. If specified, will listen to its onDispose event and destroy the module when this happens
	*
	* Returns the unique selector string that this module will bootstrap with.
	*/
	bootstrap(moduleType: any, container: HTMLElement, selectorString: string, params: BootstrapParams, input?: IEditorInput): string;

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