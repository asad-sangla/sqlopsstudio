/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!sql/parts/query/editor/media/queryTaskbar';
import { Builder, $ } from 'vs/base/browser/builder';
import { Action, IActionRunner, IAction } from 'vs/base/common/actions';
import { ActionsOrientation } from 'vs/base/browser/ui/actionbar/actionbar';
import { QueryActionBar } from 'sql/parts/query/editor/queryActionbar';
import { IContextMenuProvider } from 'vs/base/browser/ui/dropdown/dropdown';
import { IToolBarOptions } from 'vs/base/browser/ui/toolbar/toolbar';

/**
 * A wrapper for the different types of content a QueryTaskbar can display
 */
export interface ITaskbarContent {

	// Display the element created by this IAction
	action?: IAction;

	// Display a pre-created element
	element?: HTMLElement;
}

/**
 * A widget that combines an action bar for actions. This class was needed because we
 * want the ability to use the custom QueryActionBar in order to display other HTML
 * in our taskbar. Based off import ToolBar from vs/base/browser/ui/toolbar/toolbar.
 */
export class QueryTaskbar {
	private options: IToolBarOptions;
	private actionBar: QueryActionBar;
	private lookupKeybindings: boolean;

	constructor(container: HTMLElement, contextMenuProvider: IContextMenuProvider, options: IToolBarOptions = { orientation: ActionsOrientation.HORIZONTAL }) {
		this.options = options;
		this.lookupKeybindings = typeof this.options.getKeyBinding === 'function' && typeof this.options.getKeyBinding === 'function';

		let element = document.createElement('div');
		element.className = 'monaco-toolbar';
		container.appendChild(element);

		this.actionBar = new QueryActionBar($(element), {
			orientation: options.orientation,
			ariaLabel: options.ariaLabel,
			actionItemProvider: (action: Action) => {
				return options.actionItemProvider ? options.actionItemProvider(action) : null;
			}
		});
	}

	/**
	 * Creates an HTML vertical separator.
	 */
	public static createTaskbarSeparator(): HTMLElement {
		let element = document.createElement('div');
		element.className = 'queryTaskbarSeparator';
		element.innerHTML = ' ';
		return element;
	}

	/**
	 * Creates an HTML text separator.
	 */
	public static createTaskbarText(inputText: string): HTMLElement {
		let element = document.createElement('div');
		element.className = 'queryTaskbarTextSeparator';
		element.innerHTML = inputText;
		return element;
	}

	public set actionRunner(actionRunner: IActionRunner) {
		this.actionBar.actionRunner = actionRunner;
	}

	public get actionRunner(): IActionRunner {
		return this.actionBar.actionRunner;
	}

	public set context(context: any) {
		this.actionBar.context = context;
	}

	public getContainer(): Builder {
		return this.actionBar.getContainer();
	}

	public setAriaLabel(label: string): void {
		this.actionBar.setAriaLabel(label);
	}

	/**
	 * Push HTMLElements and icons for IActions into the ActionBar UI. Push IActions into ActionBar's private collection.
	 */
	public setContent(content: ITaskbarContent[]): void {
		let contentToSet: ITaskbarContent[] = content ? content.slice(0) : [];
		this.actionBar.clear();

		for (let item of contentToSet) {
			if (item.action) {
				this.actionBar.pushAction(item.action, { icon: true, label: true, keybinding: this.getKeybindingLabel(item.action) });
			} else if (item.element) {
				this.actionBar.pushElement(item.element);
			}
		}
	}

	private getKeybindingLabel(action: IAction): string {
		const key = this.lookupKeybindings ? this.options.getKeyBinding(action) : void 0;
		return key ? key.getLabel() : '';
	}

	public addAction(primaryAction: IAction): void {
		this.actionBar.pushAction(primaryAction, { icon: true, label: false, keybinding: this.getKeybindingLabel(primaryAction) });
	}

	public addElement(element: HTMLElement): void {
		this.actionBar.pushElement(element);
	}

	public dispose(): void {
		this.actionBar.dispose();
	}
}