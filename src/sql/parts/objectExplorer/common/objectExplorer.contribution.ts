/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/objectExplorer/viewlet/media/objectExplorer';
import { KeyMod, KeyCode } from 'vs/base/common/keyCodes';
import { localize } from 'vs/nls';
import { SyncActionDescriptor } from 'vs/platform/actions/common/actions';
import { IKeybindings } from 'vs/platform/keybinding/common/keybinding';
import { ViewletRegistry, Extensions as ViewletExtensions, ViewletDescriptor, ToggleViewletAction } from 'vs/workbench/browser/viewlet';
import { IWorkbenchActionRegistry, Extensions as ActionExtensions } from 'vs/workbench/common/actionRegistry';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IViewletService } from 'vs/workbench/services/viewlet/browser/viewlet';
import { Registry } from 'vs/platform/platform';

import { OBJECTEXPLORER_VIEWLET_ID } from 'sql/parts/objectExplorer/viewlet/objectExplorerViewlet';

// Viewlet Action
export class ObjectExplorerViewletAction extends ToggleViewletAction {
	public static ID = OBJECTEXPLORER_VIEWLET_ID;
	public static LABEL = 'Show Object Explorer';

	constructor(
		id: string,
		label: string,
		@IViewletService viewletService: IViewletService,
		@IWorkbenchEditorService editorService: IWorkbenchEditorService
	) {
		super(id, label, OBJECTEXPLORER_VIEWLET_ID, viewletService, editorService);
	}
}

const openViewletKb: IKeybindings = {
	primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_X
};

// Viewlet
const viewletDescriptor = new ViewletDescriptor(
	'sql/parts/objectExplorer/viewlet/objectExplorerViewlet',
	'ObjectExplorerViewlet',
	OBJECTEXPLORER_VIEWLET_ID,
	'Object Explorer',
	'objectExplorer',
	-50
);

Registry.as<ViewletRegistry>(ViewletExtensions.Viewlets).registerViewlet(viewletDescriptor);

const registry = Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions);
registry.registerWorkbenchAction(
	new SyncActionDescriptor(
		ObjectExplorerViewletAction,
		ObjectExplorerViewletAction.ID,
		ObjectExplorerViewletAction.LABEL,
		openViewletKb),
	'View: Show Object Explorer',
	localize('view', "View")
);

