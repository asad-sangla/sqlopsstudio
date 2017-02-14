/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as errors from 'vs/base/common/errors';
import { TPromise } from 'vs/base/common/winjs.base';
import { ITree, ContextMenuEvent } from 'vs/base/parts/tree/browser/tree';
import treedefaults = require('vs/base/parts/tree/browser/treeDefaults');
import { MarkersModel, Marker } from 'vs/workbench/parts/markers/common/markersModel';
import { RangeHighlightDecorations } from 'vs/workbench/common/editor/rangeDecorations';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IMenuService, IMenu, MenuId } from 'vs/platform/actions/common/actions';
import { ContributableActionProvider } from 'vs/workbench/browser/actionBarRegistry';
import { IAction } from 'vs/base/common/actions';
import { Keybinding } from 'vs/base/common/keyCodes';
import { IActionProvider } from 'vs/base/parts/tree/browser/actionsRenderer';
import { ActionItem, Separator } from 'vs/base/browser/ui/actionbar/actionbar';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { DragMouseEvent, IMouseEvent } from 'vs/base/browser/mouseEvent';
import { IKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ServerTreeRenderer, ServerTreeDataSource, Server, ServerGroup, ServerTreeDragAndDrop, AddServerToGroupAction } from 'sql/parts/connection/electron-browser/serverTreeRenderer';
import { EditorStacksModel, EditorGroup } from 'vs/workbench/common/editor/editorStacksModel';
import { keybindingForAction, SaveFileAction, RevertFileAction, SaveFileAsAction, OpenToSideAction, SelectResourceForCompareAction, CompareResourcesAction, SaveAllInGroupAction } from 'vs/workbench/parts/files/browser/fileActions';
import { IUntitledEditorService } from 'vs/workbench/services/untitled/common/untitledEditorService';
import { CloseOtherEditorsInGroupAction, CloseEditorAction, CloseEditorsInGroupAction } from 'vs/workbench/browser/parts/editor/editorActions';

export class ServerTreeActionProvider extends ContributableActionProvider {

	constructor(
		@IInstantiationService private instantiationService: IInstantiationService
	) {
		super();
	}

	public hasActions(tree: ITree, element: any): boolean {
		return element instanceof ServerGroup || (element instanceof Server);
	}

	public getActions(tree: ITree, element: any): TPromise<IAction[]> {
		if (element instanceof Server) {
			return TPromise.as(this.getServerActions());
		}
		if (element instanceof ServerGroup) {
			return TPromise.as(this.getServerGroupActions());
		}

		return TPromise.as([]);
	}

	public getServerActions(): IAction[] {
				return [
			this.instantiationService.createInstance(AddServerToGroupAction, AddServerToGroupAction.ID, AddServerToGroupAction.LABEL)
		];
	}

	public getServerGroupActions(): IAction[] {
		return [
			this.instantiationService.createInstance(AddServerToGroupAction, AddServerToGroupAction.ID, AddServerToGroupAction.LABEL)
		];
	}

	public hasSecondaryActions(tree: ITree, element: any): boolean {
		return false;
	}

	public getSecondaryActions(tree: ITree, element: any): TPromise<IAction[]> {
		return super.getSecondaryActions(tree, element);
	}
}

export class ServerTreeController extends treedefaults.DefaultController {

	constructor(private actionProvider: ServerTreeActionProvider,
		@IWorkbenchEditorService private editorService: IWorkbenchEditorService,
		@IContextMenuService private contextMenuService: IContextMenuService,
		@ITelemetryService private telemetryService: ITelemetryService,
		@IKeybindingService private keybindingService: IKeybindingService
	) {
		super({ clickBehavior: treedefaults.ClickBehavior.ON_MOUSE_DOWN });
	}

	public onClick(tree: ITree, element: any, event: IMouseEvent): boolean {

		// Close opened editor on middle mouse click
		//if (element instanceof OpenEditor && event.browserEvent && event.browserEvent.button === 1 /* Middle Button */) {
		//	const position = this.model.positionOfGroup(element.editorGroup);

		//	this.editorService.closeEditor(position, element.editorInput).done(null, errors.onUnexpectedError);

		//	return true;
	//}

		return super.onClick(tree, element, event);
	}

	protected onLeftClick(tree: ITree, element: any, event: IMouseEvent, origin: string = 'mouse'): boolean {
		return super.onLeftClick(tree, element, event, origin);
	}

	// Do not allow left / right to expand and collapse groups #7848
	protected onLeft(tree: ITree, event: IKeyboardEvent): boolean {
		return true;
	}

	protected onRight(tree: ITree, event: IKeyboardEvent): boolean {
		return true;
	}

	protected onEnter(tree: ITree, event: IKeyboardEvent): boolean {
		const element = tree.getFocus();

		/*// Editor groups should never get selected nor expanded/collapsed
		if (element instanceof EditorGroup) {
			event.preventDefault();
			event.stopPropagation();

			return true;
		}

		this.openEditor(element, false, event.ctrlKey || event.metaKey);
		*/
		return super.onEnter(tree, event);
	}

	public onContextMenu(tree: ITree, element: any, event: ContextMenuEvent): boolean {
		if (event.target && event.target.tagName && event.target.tagName.toLowerCase() === 'input') {
			return false;
		}
		// Check if clicked on some element
		if (element === tree.getInput()) {
			return false;
		}

		event.preventDefault();
		event.stopPropagation();

		tree.setFocus(element);
		var parent: ServerGroup = null;
		if (element instanceof ServerGroup) {
			parent = <ServerGroup>element;
		}
		else if (element instanceof Server) {
			parent = (<Server>element).parent;
		}
		//const group = element instanceof EditorGroup ? element : (<OpenEditor>element).editorGroup;
		//const editor = element instanceof OpenEditor ? (<OpenEditor>element).editorInput : undefined;

		let anchor = { x: event.posx + 1, y: event.posy };
		this.contextMenuService.showContextMenu({
			getAnchor: () => anchor,
			getActions: () => this.actionProvider.getActions(tree, element),
			getKeyBinding: (action) => keybindingForAction(action.id, this.keybindingService),
			onHide: (wasCancelled?: boolean) => {
				if (wasCancelled) {
					tree.DOMFocus();
				}
			},
			getActionsContext: () => (parent)
		});

		return true;
	}
}