/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/advancedProperties';
import { Builder, $ } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import { Widget } from 'vs/base/browser/ui/widget';
import { FixedCollapsibleView } from 'sql/platform/views/fixedCollapsibleView';
import { SplitView, CollapsibleState } from 'vs/base/browser/ui/splitview/splitview';
import * as lifecycle from 'vs/base/common/lifecycle';
import * as DialogHelper from 'sql/parts/common/modal/dialogHelper';
import { DialogSelectBox } from 'sql/parts/common/modal/dialogSelectBox';
import { InputBox } from 'vs/base/browser/ui/inputbox/inputBox';
import { AdvancedPropertiesHelper, IAdvancedPropertyElement } from 'sql/parts/connection/connectionDialog/advancedPropertiesHelper';
import { ServiceOptionType } from 'sql/parts/connection/common/connectionManagement';
import data = require('data');
import { Modal } from 'sql/parts/common/modal/modal';
import { IWorkbenchThemeService, IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';
import { contrastBorder } from 'vs/platform/theme/common/colorRegistry';
import * as styler from 'vs/platform/theme/common/styler';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Event, { Emitter } from 'vs/base/common/event';
import { SIDE_BAR_BACKGROUND } from 'vs/workbench/common/theme';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { localize } from 'vs/nls';

class OptionPropertiesView extends FixedCollapsibleView {
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

export class AdvancedPropertiesDialog extends Modal {
	private _body: HTMLElement;
	private _propertyGroups: HTMLElement;
	private _dividerBuilder: Builder;
	private _okButton: Button;
	private _closeButton: Button;
	private _toDispose: lifecycle.IDisposable[] = [];
	private _toDisposeTheming: lifecycle.IDisposable[] = [];
	private _advancedPropertiesMap: { [propertyName: string]: IAdvancedPropertyElement } = {};
	private _propertyTitle: Builder;
	private _propertyDescription: Builder;
	private _options: { [name: string]: any };
	private _propertyRowSize = 31;
	private _propertyCategoryPadding = 30;
	private _categoryHeaderSize = 22;

	private _onOk = new Emitter<void>();
	public onOk: Event<void> = this._onOk.event;

	private _onCloseEvent = new Emitter<void>();
	public onCloseEvent: Event<void> = this._onCloseEvent.event;

	constructor(
		@IPartService partService: IPartService,
		@IWorkbenchThemeService private _themeService: IWorkbenchThemeService,
		@IContextViewService private _contextViewService: IContextViewService) {
		super(localize('advancedProperties', 'Advanced properties'), partService, { hasBackButton: true });
	}

	public render() {
		super.render();
		this.backButton.addListener('click', () => this.cancel());
		attachModalDialogStyler(this, this._themeService);
		styler.attachButtonStyler(this.backButton, this._themeService, { buttonBackground: SIDE_BAR_BACKGROUND, buttonHoverBackground: SIDE_BAR_BACKGROUND });
		let okLabel = localize('ok', 'OK');
		let discardLabel = localize('discard', 'Discard');
		this._okButton = this.addFooterButton(okLabel, () => this.ok());
		this._closeButton = this.addFooterButton(discardLabel, () => this.cancel());
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
		new Builder(container).div({ class: 'advancedDialog-properties' }, (bodyBuilder) => {
			this._body = bodyBuilder.getHTMLElement();
		});

		let builder = new Builder(this._body);
		builder.div({ class: 'Connection-divider' }, (dividerContainer) => {
			this._dividerBuilder = dividerContainer;
		});

		builder.div({ class: 'advancedDialog-description' }, (descriptionContainer) => {
			descriptionContainer.div({ class: 'modal-title' }, (propertyTitle) => {
				this._propertyTitle = propertyTitle;
			});
			descriptionContainer.div({ class: 'advancedDialog-description-content' }, (propertyDescription) => {
				this._propertyDescription = propertyDescription;
			});
		});
	}

	// Update theming that is specific to advanced properties flyout body
	private updateTheme(theme: IColorTheme): void {
		let borderColor = theme.getColor(contrastBorder);
		let border = borderColor ? borderColor.toString() : null;
		if (this._dividerBuilder) {
			this._dividerBuilder.style('border-top-width', border ? '1px' : null);
			this._dividerBuilder.style('border-top-style', border ? 'solid' : null);
			this._dividerBuilder.style('border-top-color', border);
		}
	}

	private onAdvancedPropertyLinkClicked(propertyName: string): void {
		var property = this._advancedPropertiesMap[propertyName].advancedProperty;
		this._propertyTitle.innerHtml(property.displayName);
		this._propertyDescription.innerHtml(property.description);
	}

	private fillInProperties(container: Builder, connectionOptions: data.ConnectionOption[]): void {
		for (var i = 0; i < connectionOptions.length; i++) {
			var property: data.ConnectionOption = connectionOptions[i];
			var rowContainer = DialogHelper.appendRow(container, property.displayName, 'advancedDialog-label', 'advancedDialog-input');
			AdvancedPropertiesHelper.createAdvancedProperty(property, rowContainer, this._options, this._advancedPropertiesMap, this._contextViewService, (name) => this.onAdvancedPropertyLinkClicked(name));
		}
	}

	private registerStyling(): void {
		// Theme styler
		for (var key in this._advancedPropertiesMap) {
			var widget: Widget = this._advancedPropertiesMap[key].advancedPropertyWidget;
			var property = this._advancedPropertiesMap[key].advancedProperty;
			switch (property.valueType) {
				case ServiceOptionType.category:
				case ServiceOptionType.boolean:
					this._toDispose.push(styler.attachSelectBoxStyler(<DialogSelectBox>widget, this._themeService));
					break;
				case ServiceOptionType.string:
				case ServiceOptionType.password:
				case ServiceOptionType.number:
					this._toDispose.push(styler.attachInputBoxStyler(<InputBox>widget, this._themeService));
			}
		}
	}

	public get options(): { [name: string]: string } {
		return this._options;
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
		if (AdvancedPropertiesHelper.validateInputs(this._advancedPropertiesMap)) {
			AdvancedPropertiesHelper.updateProperties(this._options, this._advancedPropertiesMap);
			this._onOk.fire();
			this.close();
		}
	}

	public cancel() {
		this.close();
	}

	public close() {
		this._propertyGroups.remove();
		this.dispose();
		this.hide();
		this._onCloseEvent.fire();
	}

	public open(connectionPropertiesMaps: { [category: string]: data.ConnectionOption[] }, options: { [name: string]: any }) {
		this._options = options;
		var firstProperty: string;
		var containerGroup: Builder;
		var layoutSize = 0;
		var propertiesContentbuilder: Builder = $().div({ class: 'advancedDialog-properties-groups' }, (container) => {
			containerGroup = container;
			this._propertyGroups = container.getHTMLElement();
		});
		var splitview = new SplitView(containerGroup.getHTMLElement());
		for (var category in connectionPropertiesMaps) {
			var propertyOptions: data.ConnectionOption[] = connectionPropertiesMaps[category];
			var bodyContainer = $().element('table', { class: 'advancedDialog-table' }, (tableContainer: Builder) => {
				this.fillInProperties(tableContainer, propertyOptions);
			});

			var viewSize = this._propertyCategoryPadding + propertyOptions.length * this._propertyRowSize;
			layoutSize += (viewSize + this._categoryHeaderSize);
			var categoryView = new OptionPropertiesView(category, bodyContainer.getHTMLElement(), false, viewSize, this._categoryHeaderSize);
			splitview.addView(categoryView);

			if (!firstProperty) {
				firstProperty = propertyOptions[0].name;
			}
		}
		splitview.layout(layoutSize);
		let body = new Builder(this._body);
		body.append(propertiesContentbuilder.getHTMLElement(), 0);
		this.show();
		var firstPropertyWidget = this._advancedPropertiesMap[firstProperty].advancedPropertyWidget;
		firstPropertyWidget.focus();

		this.registerStyling();
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
		for (var key in this._advancedPropertiesMap) {
			var widget: Widget = this._advancedPropertiesMap[key].advancedPropertyWidget;
			widget.dispose();
			delete this._advancedPropertiesMap[key];
		}
	}
}