/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/optionsDialog';
import { Builder, $ } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import { Widget } from 'vs/base/browser/ui/widget';
import { FixedCollapsibleView } from 'sql/platform/views/fixedCollapsibleView';
import { SplitView, CollapsibleState } from 'vs/base/browser/ui/splitview/splitview';
import * as lifecycle from 'vs/base/common/lifecycle';
import * as DialogHelper from 'sql/parts/common/modal/dialogHelper';
import { DialogSelectBox } from 'sql/parts/common/modal/dialogSelectBox';
import { InputBox } from 'vs/base/browser/ui/inputbox/inputBox';
import { IModalOptions, Modal } from 'sql/parts/common/modal/modal';
import * as OptionsDialogHelper from 'sql/parts/common/modal/optionsDialogHelper';
import { IWorkbenchThemeService, IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';
import { contrastBorder } from 'vs/platform/theme/common/colorRegistry';
import * as styler from 'vs/platform/theme/common/styler';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Event, { Emitter } from 'vs/base/common/event';
import { SIDE_BAR_BACKGROUND } from 'vs/workbench/common/theme';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { localize } from 'vs/nls';
import data = require('data');

class CategoryView extends FixedCollapsibleView {
	private _treecontainer: HTMLElement;
	constructor(private viewTitle: string, private _bodyContainer: HTMLElement, collapsed: boolean, initialBodySize: number, headerSize: number) {
		super({
			expandedBodySize: initialBodySize,
			sizing: headerSize,
			initialState: collapsed ? CollapsibleState.COLLAPSED : CollapsibleState.EXPANDED,
			ariaHeaderLabel: viewTitle
		});
	}

	public renderHeader(container: HTMLElement): void {
		const titleDiv = $('div.title').appendTo(container);
		$('span').text(this.viewTitle).appendTo(titleDiv);
	}

	public renderBody(container: HTMLElement): void {
		this._treecontainer = document.createElement('div');
		container.appendChild(this._treecontainer);
		this._treecontainer.appendChild(this._bodyContainer);
	}

	public layoutBody(size: number): void {
		this._treecontainer.style.height = size + 'px';
	}
}

export class OptionsDialog extends Modal {
	private _body: HTMLElement;
	private _optionGroups: HTMLElement;
	private _dividerBuilder: Builder;
	private _okButton: Button;
	private _closeButton: Button;
	private _toDispose: lifecycle.IDisposable[] = [];
	private _toDisposeTheming: lifecycle.IDisposable[] = [];
	private _optionTitle: Builder;
	private _optionDescription: Builder;
	private _optionElements: { [optionName: string]: OptionsDialogHelper.IOptionElement } = {};
	private _optionValues: { [optionName: string]: string };
	private _optionRowSize = 31;
	private _optionCategoryPadding = 30;
	private _categoryHeaderSize = 22;

	private _onOk = new Emitter<void>();
	public onOk: Event<void> = this._onOk.event;

	private _onCloseEvent = new Emitter<void>();
	public onCloseEvent: Event<void> = this._onCloseEvent.event;

	public okLabel: string = localize('ok', 'OK');
	public cancelLabel: string = localize('cancel', 'Cancel');

	constructor(
		title: string,
		options: IModalOptions,
		@IPartService partService: IPartService,
		@IWorkbenchThemeService private _themeService: IWorkbenchThemeService,
		@IContextViewService private _contextViewService: IContextViewService) {
		super(title, partService, options);
	}

	public render() {
		super.render();
		attachModalDialogStyler(this, this._themeService);
		if (this.backButton) {
			this.backButton.addListener('click', () => this.cancel());
			styler.attachButtonStyler(this.backButton, this._themeService, { buttonBackground: SIDE_BAR_BACKGROUND, buttonHoverBackground: SIDE_BAR_BACKGROUND });
		}
		this._okButton = this.addFooterButton(this.okLabel, () => this.ok());
		this._closeButton = this.addFooterButton(this.cancelLabel, () => this.cancel());
		// Theme styler
		styler.attachButtonStyler(this._okButton, this._themeService);
		styler.attachButtonStyler(this._closeButton, this._themeService);
		let self = this;
		this._toDisposeTheming.push(self._themeService.onDidColorThemeChange((e) => {
			self.updateTheme(e);
		}));
		self.updateTheme(self._themeService.getColorTheme());

	}

	protected renderBody(container: HTMLElement) {
		new Builder(container).div({ class: 'optionsDialog-options' }, (bodyBuilder) => {
			this._body = bodyBuilder.getHTMLElement();
		});

		let builder = new Builder(this._body);
		builder.div({ class: 'Connection-divider' }, (dividerContainer) => {
			this._dividerBuilder = dividerContainer;
		});

		builder.div({ class: 'optionsDialog-description' }, (descriptionContainer) => {
			descriptionContainer.div({ class: 'modal-title' }, (optionTitle) => {
				this._optionTitle = optionTitle;
			});
			descriptionContainer.div({ class: 'optionsDialog-description-content' }, (optionDescription) => {
				this._optionDescription = optionDescription;
			});
		});
	}

	// Update theming that is specific to options dialog flyout body
	private updateTheme(theme: IColorTheme): void {
		let borderColor = theme.getColor(contrastBorder);
		let border = borderColor ? borderColor.toString() : null;
		if (this._dividerBuilder) {
			this._dividerBuilder.style('border-top-width', border ? '1px' : null);
			this._dividerBuilder.style('border-top-style', border ? 'solid' : null);
			this._dividerBuilder.style('border-top-color', border);
		}
	}

	private onOptionLinkClicked(optionName: string): void {
		var option = this._optionElements[optionName].option;
		this._optionTitle.innerHtml(option.displayName);
		this._optionDescription.innerHtml(option.description);
	}

	private fillInOptions(container: Builder, options: data.ServiceOption[]): void {
		for (var i = 0; i < options.length; i++) {
			var option: data.ServiceOption = options[i];
			var rowContainer = DialogHelper.appendRow(container, option.displayName, 'optionsDialog-label', 'optionsDialog-input');
			OptionsDialogHelper.createOptionElement(option, rowContainer, this._optionValues, this._optionElements, this._contextViewService, (name) => this.onOptionLinkClicked(name));
		}
	}

	private registerStyling(): void {
		// Theme styler
		for (var optionName in this._optionElements) {
			var widget: Widget = this._optionElements[optionName].optionWidget;
			var option = this._optionElements[optionName].option;
			switch (option.valueType) {
				case OptionsDialogHelper.ServiceOptionType.category:
				case OptionsDialogHelper.ServiceOptionType.boolean:
					this._toDispose.push(styler.attachSelectBoxStyler(<DialogSelectBox>widget, this._themeService));
					break;
				case OptionsDialogHelper.ServiceOptionType.string:
				case OptionsDialogHelper.ServiceOptionType.password:
				case OptionsDialogHelper.ServiceOptionType.number:
					this._toDispose.push(styler.attachInputBoxStyler(<InputBox>widget, this._themeService));
			}
		}
	}

	public get optionValues(): { [name: string]: any } {
		return this._optionValues;
	}

	public hideError() {
		this.setError('');
	}

	public showError(err: string) {
		this.setError(err);
	}

	/* Overwrite escape key behavior */
	protected onClose() {
		this.close();
	}

	/* Overwrite enter key behavior */
	protected onAccept() {
		this.ok();
	}

	public ok(): void {
		if (OptionsDialogHelper.validateInputs(this._optionElements)) {
			OptionsDialogHelper.updateOptions(this._optionValues, this._optionElements);
			this._onOk.fire();
			this.close();
		}
	}

	public cancel() {
		this.close();
	}

	public close() {
		this._optionGroups.remove();
		this.dispose();
		this.hide();
		this._onCloseEvent.fire();
	}

	public open(options: data.ServiceOption[], optionValues: { [name: string]: any }) {
		this._optionValues = optionValues;
		var firstOption: string;
		var containerGroup: Builder;
		var layoutSize = 0;
		var optionsContentBuilder: Builder = $().div({ class: 'optionsDialog-options-groups' }, (container) => {
			containerGroup = container;
			this._optionGroups = container.getHTMLElement();
		});
		var splitview = new SplitView(containerGroup.getHTMLElement());
		let categoryMap = OptionsDialogHelper.groupOptionsByCategory(options);
		for (var category in categoryMap) {
			var serviceOptions: data.ServiceOption[] = categoryMap[category];
			var bodyContainer = $().element('table', { class: 'optionsDialog-table' }, (tableContainer: Builder) => {
				this.fillInOptions(tableContainer, serviceOptions);
			});

			var viewSize = this._optionCategoryPadding + serviceOptions.length * this._optionRowSize;
			layoutSize += (viewSize + this._categoryHeaderSize);
			var categoryView = new CategoryView(category, bodyContainer.getHTMLElement(), false, viewSize, this._categoryHeaderSize);
			splitview.addView(categoryView);

			if (!firstOption) {
				firstOption = serviceOptions[0].name;
			}
		}
		splitview.layout(layoutSize);
		let body = new Builder(this._body);
		body.append(optionsContentBuilder.getHTMLElement(), 0);
		this.show();
		var firstOptionWidget = this._optionElements[firstOption].optionWidget;
		firstOptionWidget.focus();

		this.registerStyling();
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
		for (var optionName in this._optionElements) {
			var widget: Widget = this._optionElements[optionName].optionWidget;
			widget.dispose();
			delete this._optionElements[optionName];
		}
	}
}