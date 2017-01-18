/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/extensionsViewlet';
import { localize } from 'vs/nls';
import { ThrottledDelayer, always } from 'vs/base/common/async';
import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { Builder, Dimension } from 'vs/base/browser/builder';
import EventOf, { mapEvent, chain } from 'vs/base/common/event';
import { domEvent } from 'vs/base/browser/event';
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode } from 'vs/base/common/keyCodes';
import { Viewlet } from 'vs/workbench/browser/viewlet';
import { IViewletService } from 'vs/workbench/services/viewlet/browser/viewlet';
import { append, $, addStandardDisposableListener, EventType, addClass, removeClass, toggleClass } from 'vs/base/browser/dom';
import { PagedModel, IPagedModel } from 'vs/base/common/paging';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { PagedList } from 'vs/base/browser/ui/list/listPaging';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { Delegate } from 'vs/workbench/parts/extensions/browser/extensionsList';

import { IConnection, IConnectionsViewlet, IRegisteredServersService, VIEWLET_ID } from 'sql/parts/connection/common/registeredServers';
import { Renderer } from 'sql/parts/connection/electron-browser/connectionList';

export class ConnectionViewlet extends Viewlet implements IConnectionsViewlet {

	private searchDelayer: ThrottledDelayer<any>;
	private root: HTMLElement;
	private searchBox: HTMLInputElement;
	private extensionsBox: HTMLElement;
	private messageBox: HTMLElement;
	private list: PagedList<IConnection>;
	private disposables: IDisposable[] = [];

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IRegisteredServersService private registeredServersService: IRegisteredServersService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IViewletService private viewletService: IViewletService
	) {
		super(VIEWLET_ID, telemetryService);
		this.searchDelayer = new ThrottledDelayer(500);
	}

	create(parent: Builder): TPromise<void> {
		super.create(parent);
		parent.addClass('extensions-viewlet');
		this.root = parent.getHTMLElement();

		const header = append(this.root, $('.header'));

		this.searchBox = append(header, $<HTMLInputElement>('input.search-box'));
		this.searchBox.placeholder = "Find Server";
		this.disposables.push(addStandardDisposableListener(this.searchBox, EventType.FOCUS, () => addClass(this.searchBox, 'synthetic-focus')));
		this.disposables.push(addStandardDisposableListener(this.searchBox, EventType.BLUR, () => removeClass(this.searchBox, 'synthetic-focus')));

		this.extensionsBox = append(this.root, $('.extensions'));
		this.messageBox = append(this.root, $('.message'));

		const delegate = new Delegate();
		const renderer = this.instantiationService.createInstance(Renderer);
		this.list = new PagedList(this.extensionsBox, delegate, [renderer]);

		const onKeyDown = chain(domEvent(this.searchBox, 'keydown'))
			.map(e => new StandardKeyboardEvent(e));

		onKeyDown.filter(e => e.keyCode === KeyCode.Enter).on(this.onEnter, this, this.disposables);
		onKeyDown.filter(e => e.keyCode === KeyCode.Escape).on(this.onEscape, this, this.disposables);
		onKeyDown.filter(e => e.keyCode === KeyCode.UpArrow).on(this.onUpArrow, this, this.disposables);
		onKeyDown.filter(e => e.keyCode === KeyCode.DownArrow).on(this.onDownArrow, this, this.disposables);
		onKeyDown.filter(e => e.keyCode === KeyCode.PageUp).on(this.onPageUpArrow, this, this.disposables);
		onKeyDown.filter(e => e.keyCode === KeyCode.PageDown).on(this.onPageDownArrow, this, this.disposables);

		return TPromise.as(null);
	}

	search(value: string): void {
	}

	setVisible(visible: boolean): TPromise<void> {
		return super.setVisible(visible).then(() => {
			if (visible) {
				this.searchBox.focus();
				this.searchBox.setSelectionRange(0, this.searchBox.value.length);

				this.populateServerList().then(model => {
					this.setModel(model);
				});
			} else {
				this.setModel(new PagedModel([]));
			}
		});
	}

	focus(): void {
		this.searchBox.focus();
	}

	layout({ height, width }: Dimension): void {
		this.list.layout(height - 38);
		toggleClass(this.root, 'narrow', width <= 300);
	}

	getOptimalWidth(): number {
		return 400;
	}

	private setModel(model: IPagedModel<IConnection>) {
		this.list.model = model;
		this.list.scrollTop = 0;

		toggleClass(this.extensionsBox, 'hidden', model.length === 0);
		toggleClass(this.messageBox, 'hidden', model.length > 0);

		if (model.length === 0 && this.isVisible()) {
			this.messageBox.textContent = localize('no extensions found', "No extensions found.");
		} else {
			this.messageBox.textContent = '';
		}
	}

	private populateServerList(): TPromise<IPagedModel<IConnection>> {
		return this.registeredServersService.getConnections()
				.then(result => new PagedModel(result));
	}

	private onEnter(): void {
		this.list.setSelection(...this.list.getFocus());
	}

	private onEscape(): void {
		this.search('');
	}

	private onUpArrow(): void {
		this.list.focusPrevious();
		this.list.reveal(this.list.getFocus()[0]);
	}

	private onDownArrow(): void {
		this.list.focusNext();
		this.list.reveal(this.list.getFocus()[0]);
	}

	private onPageUpArrow(): void {
		this.list.focusPreviousPage();
		this.list.reveal(this.list.getFocus()[0]);
	}

	private onPageDownArrow(): void {
		this.list.focusNextPage();
		this.list.reveal(this.list.getFocus()[0]);
	}
}
