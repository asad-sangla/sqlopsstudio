/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { CollapsibleView, ICollapsibleViewOptions } from 'vs/workbench/parts/views/browser/views';
import { List } from 'vs/base/browser/ui/list/listWidget';
import { IAction, ActionRunner } from 'vs/base/common/actions';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { $ } from 'vs/base/browser/builder';
import { CountBadge } from 'vs/base/browser/ui/countBadge/countBadge';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { attachBadgeStyler } from 'vs/platform/theme/common/styler';
import { CollapsibleState } from 'vs/base/browser/ui/splitview/splitview';

export class FixedListView extends CollapsibleView {
	private _badge: CountBadge;
	private _disposables: IDisposable[] = [];

	constructor(
		initialSize: number,
		private _viewTitle: string,
		private _list: List<any>,
		private _bodyContainer: HTMLElement,
		collapsed: boolean,
		headerSize: number,
		private _actions: IAction[],
		actionRunner: ActionRunner,
		contextMenuService: IContextMenuService,
		keybindingService: IKeybindingService,
		private _themeService: IThemeService) {
		super(initialSize, <ICollapsibleViewOptions>{
			id: _viewTitle,
			name: _viewTitle,
			actionRunner: actionRunner,
			collapsed: false,
			ariaHeaderLabel: _viewTitle,
			sizing: headerSize,
			initialBodySize: undefined
		}, keybindingService, contextMenuService);

	}

	public renderHeader(container: HTMLElement): void {
		const titleDiv = $('div.title').appendTo(container);
		$('span').text(this._viewTitle).appendTo(titleDiv);
		super.renderHeader(container);

		// show the badge
		this._badge = new CountBadge($('.count-badge-wrapper').appendTo(container).getHTMLElement());
		this._disposables.push(attachBadgeStyler(this._badge, this._themeService));
	}

	public updateList(content: any[]) {
		this._list.splice(0, this._list.length, content);
		this._badge.setCount(this._list.length);
		this._list.layout(this._list.contentHeight);
	}

	public listContentHeight(): number {
		return this._list.contentHeight;
	}

	public renderBody(container: HTMLElement): void {
		container.appendChild(this._bodyContainer);
	}

	public get fixedSize(): number {
		return this.state === CollapsibleState.EXPANDED ? this.expandedSize : this.headerSize;
	}

	private get expandedSize(): number {
		if (this._list && this._list.contentHeight) {
			return this._list.contentHeight + this.headerSize;
		}

		return this.headerSize;
	}

	protected changeState(state: CollapsibleState): void {
		super.changeState(state);
		this.setFixed(this.fixedSize);
	}

	/**
	 * Return actions for the view
	 */
	public getActions(): IAction[] {
		return this._actions;
	}

	public dispose(): void {
		this._disposables = dispose(this._disposables);
		super.dispose();
	}
}