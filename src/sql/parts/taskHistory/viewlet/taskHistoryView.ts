/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import nls = require('vs/nls');
import errors = require('vs/base/common/errors');
import { IActionRunner, IAction } from 'vs/base/common/actions';
import dom = require('vs/base/browser/dom');
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { CollapsibleViewletView } from 'vs/workbench/browser/viewlet';
import * as builder from 'vs/base/browser/builder';
import { IMessageService } from 'vs/platform/message/common/message';
import Severity from 'vs/base/common/severity';
import { Tree } from 'vs/base/parts/tree/browser/treeImpl';
import { TaskHistoryRenderer } from 'sql/parts/taskHistory/viewlet/taskHistoryRenderer';
import { TaskHistoryDataSource } from 'sql/parts/taskHistory/viewlet/taskHistoryDataSource';
import { TaskHistoryController } from 'sql/parts/taskHistory/viewlet/taskHistoryController';
import { TaskHistoryActionProvider } from 'sql/parts/taskHistory/viewlet/taskHistoryActionProvider';
import { DefaultFilter, DefaultDragAndDrop, DefaultAccessibilityProvider } from 'vs/base/parts/tree/browser/treeDefaults';
import { TaskService } from 'sql/parts/taskHistory/common/taskService';

const $ = builder.$;

/**
 * TaskHistoryView implements the dynamic tree view.
 */
export class TaskHistoryView extends CollapsibleViewletView {

	public messages: builder.Builder;
	private _taskService: TaskService;

	constructor(actionRunner: IActionRunner, settings: any,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IMessageService messageService: IMessageService,
	) {
		super(actionRunner, false, nls.localize({ key: 'taskHistorySection', comment: ['Task History Tree'] }, 'Task History Section'), messageService, keybindingService, contextMenuService);
		this._taskService = new TaskService();
	}

	/**
	 * Render header of the view
	 */
	public renderHeader(container: HTMLElement): void {
		const titleDiv = $('div.title').appendTo(container);
		$('span').text(nls.localize('taskHistory', 'Task History')).appendTo(titleDiv);
		super.renderHeader(container);
	}

	/**
	 * Render the view body
	 */
	public renderBody(container: HTMLElement): void {
		// Add div to display no connections found message and hide it by default
		this.messages = $('div.title').appendTo(container);
		$('span').text('No history task found.').appendTo(this.messages);
		this.messages.hide();

		this.treeContainer = super.renderViewTree(container);
		dom.addClass(this.treeContainer, 'task-history-view');

		this.tree = this.createTaskHistoryTree(this.treeContainer, this.instantiationService);
		const self = this;
		// Refresh Tree when these events are emitted
		self.refreshTree();
	}

	/**
	 * Create a task history tree
	 */
	public createTaskHistoryTree(treeContainer: HTMLElement, instantiationService: IInstantiationService): Tree {
		const dataSource = instantiationService.createInstance(TaskHistoryDataSource);
		const actionProvider = instantiationService.createInstance(TaskHistoryActionProvider);
		const renderer = instantiationService.createInstance(TaskHistoryRenderer);
		const controller = instantiationService.createInstance(TaskHistoryController, actionProvider);
		const dnd = new DefaultDragAndDrop();
		const filter = new DefaultFilter();
		const sorter = null;
		const accessibilityProvider = new DefaultAccessibilityProvider();

		return new Tree(treeContainer, {
			dataSource, renderer, controller, dnd, filter, sorter, accessibilityProvider
		}, {
				indentPixels: 10,
				twistiePixels: 20,
				ariaLabel: nls.localize({ key: 'regTreeAriaLabel', comment: ['TaskHistory'] }, 'Task history')
			});
	}

	/**
	 * Return actions for the view
	 */
	public getActions(): IAction[] {
		return [];
	}

	public refreshTree(): void {
		this.messages.hide();
		let selectedElement: any;
		let targetsToExpand: any[];

		// Focus
		this.tree.DOMFocus();

		if (this.tree) {
			let selection = this.tree.getSelection();
			if (selection && selection.length === 1) {
				selectedElement = <any>selection[0];
			}
			targetsToExpand = this.tree.getExpandedElements();
		}

		//Get the tree Input
		let treeInput = this._taskService.getAllTasks();
		if (treeInput) {
			if (treeInput !== this.tree.getInput()) {
				this.tree.setInput(treeInput).then(() => {
					// Make sure to expand all folders that where expanded in the previous session
					if (targetsToExpand) {
						this.tree.expandAll(targetsToExpand);
					}
					if (selectedElement) {
						this.tree.select(selectedElement);
					}
					this.tree.getFocus();
				}, errors.onUnexpectedError);
			}
		}
	}

	private onError(err: any): void {
		if (errors.isPromiseCanceledError(err)) {
			return;
		}
		this.messageService.show(Severity.Error, err);
	}

	public dispose(): void {
		super.dispose();
	}
}