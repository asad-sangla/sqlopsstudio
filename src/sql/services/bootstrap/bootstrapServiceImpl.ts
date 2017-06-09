/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { $ } from 'vs/base/browser/dom';

import { NgModuleRef } from '@angular/core';
import { platformBrowserDynamic, } from '@angular/platform-browser-dynamic';

import { BootstrapParams } from 'sql/services/bootstrap/bootstrapParams';
import { IConnectionManagementService, IConnectionDialogService, IErrorMessageService }
	from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/services/metadata/metadataService';
import { IObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { IAdminService } from 'sql/parts/admin/common/adminService';
import { DisasterRecoveryUiService } from 'sql/parts/disasterRecovery/common/disasterRecoveryUiService';
import { IDisasterRecoveryService, IDisasterRecoveryUiService } from 'sql/parts/disasterRecovery/common/interfaces';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IWorkbenchThemeService } from 'vs/workbench/services/themes/common/workbenchThemeService';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { IEditorInput } from 'vs/platform/editor/common/editor';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from './bootstrapService';


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
		@IWorkbenchThemeService public themeService: IWorkbenchThemeService,
		@IDisasterRecoveryService public disasterRecoveryService: IDisasterRecoveryService,
		@IDisasterRecoveryUiService public disasterRecoveryUiService: IDisasterRecoveryUiService,
		@IConnectionDialogService public connectionDialogService: IConnectionDialogService,
		@IQueryModelService public queryModelService: IQueryModelService,
		@IKeybindingService public keybindingService: IKeybindingService,
		@IContextKeyService public contextKeyService: IContextKeyService,
		@IContextMenuService public contextMenuService: IContextMenuService,
		@IErrorMessageService public errorMessageService: IErrorMessageService,
		@IPartService public partService: IPartService
	) {
		this._bootstrapParameterMap = new Map<string, BootstrapParams>();
		this._selectorQueueMap = new Map<string, string[]>();
		this._selectorCountMap = new Map<string, number>();
	}

	public bootstrap(moduleType: any, container: HTMLElement, selectorString: string, params: BootstrapParams, input?: IEditorInput): string {
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
		platformBrowserDynamic(providers).bootstrapModule(moduleType).then(moduleRef => {
			if (input) {
				input.onDispose(() => moduleRef.destroy());
			}
		});

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