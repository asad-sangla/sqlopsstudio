/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!sql/parts/common/flyoutDialog/media/flyoutDialog';
import 'vs/css!./media/advancedProperties';
import { Builder, $ } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import { Widget } from 'vs/base/browser/ui/widget';
import { SplitView, FixedCollapsibleView, CollapsibleState } from 'vs/base/browser/ui/splitview/splitview';
import * as lifecycle from 'vs/base/common/lifecycle';
import { DialogHelper } from 'sql/parts/common/flyoutDialog/dialogHelper';
import { DialogSelectBox } from 'sql/parts/common/flyoutDialog/dialogSelectBox';
import { InputBox } from 'vs/base/browser/ui/inputbox/inputBox';
import { AdvancedPropertiesHelper, IAdvancedPropertyElement } from 'sql/parts/connection/connectionDialog/advancedPropertiesHelper';
import { ServiceOptionType } from 'sql/parts/connection/common/connectionManagement';
import data = require('data');
import { ModalDialogBuilder } from 'sql/parts/common/flyoutDialog/modalDialogBuilder';
import DOM = require('vs/base/browser/dom');
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode } from 'vs/base/common/keyCodes';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import * as colorRegistry from 'vs/platform/theme/common/colorRegistry';
import * as styler from 'vs/platform/theme/common/styler';

export interface IAdvancedDialogCallbacks {
	onOk: () => void;
	onClose: () => void;
}

class OptionPropertiesView extends FixedCollapsibleView {
	private _treecontainer: HTMLElement;
	constructor(private viewTitle: string, private _bodyContainer: HTMLElement, collapsed: boolean, initialBodySize: number, headerSize: number) {
		super({
			expandedBodySize: initialBodySize,
			headerSize: headerSize,
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

export class AdvancedPropertiesDialog {
	private _builder: Builder;
	private _container: HTMLElement;
	private _modelElement: HTMLElement;
	private _callbacks: IAdvancedDialogCallbacks;
	private _okButton: Button;
	private _closeButton: Button;
	private _backButton: Button;
	private _toDispose: lifecycle.IDisposable[];
	private _advancedPropertiesMap: { [propertyName: string]: IAdvancedPropertyElement };
	private _propertyTitle: Builder;
	private _propertyDescription: Builder;
	private _dialog: ModalDialogBuilder;
	private _options: { [name: string]: any };
	private _propertyRowSize = 31;
	private _propertyCategoryPadding = 30;
	private _categoryHeaderSize = 22;

	constructor(container: HTMLElement,
		callbacks: IAdvancedDialogCallbacks,
		@IThemeService private _themeService: IThemeService) {
		this._container = container;
		this._callbacks = callbacks;
		this._toDispose = [];
		this._advancedPropertiesMap = {};
	}

	public create(): HTMLElement {
		this._dialog = new ModalDialogBuilder('advancedDialogModal', 'Advanced Properties', 'advanced-dialog', 'advancedBody');
		this._builder = this._dialog.create(true);
		this._dialog.bodyContainer.div({ class: 'advancedDialog-properties', id: 'propertiesContent' });
		this._dialog.addErrorMessage();
		this._dialog.bodyContainer.div({ class: 'advancedDialog-description' }, (descriptionContainer) => {
			descriptionContainer.div({ class: 'modal-title' }, (propertyTitle) => {
				this._propertyTitle = propertyTitle;
			});
			descriptionContainer.div({ class: 'advancedDialog-description-content' }, (propertyDescription) => {
				this._propertyDescription = propertyDescription;
			});
		});
		this._backButton = this.createBackButton(this._dialog.headerContainer);
		this._dialog.addModalTitle();
		this._okButton = this.createFooterButton(this._dialog.footerContainer, 'OK');
		this._closeButton = this.createFooterButton(this._dialog.footerContainer, 'Go Back');

		this._builder.build(this._container);
		this._modelElement = this._builder.getHTMLElement();

		// Theme styler
		styler.attachButtonStyler(this._okButton, this._themeService);
		styler.attachButtonStyler(this._closeButton, this._themeService);
		styler.attachButtonStyler(this._backButton, this._themeService, { buttonBackground: colorRegistry.selectionBackground, buttonHoverBackground: colorRegistry.selectionBackground });

		return this._modelElement;
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
			AdvancedPropertiesHelper.createAdvancedProperty(property, rowContainer, this._options, this._advancedPropertiesMap, (name) => this.onAdvancedPropertyLinkClicked(name));
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

	private createBackButton(container: Builder): Button {
		let button;
		container.div({ class: 'modal-go-back' }, (cellContainer) => {
			button = new Button(cellContainer);
			button.icon = 'backButtonIcon';
			button.addListener('click', () => {
				this.cancel();
			});
		});

		return button;
	}

	private createFooterButton(container: Builder, title: string): Button {
		let button;
		container.div({ class: 'footer-button' }, (cellContainer) => {
			button = new Button(cellContainer);
			button.label = title;
			button.addListener('click', () => {
				if (title === 'OK') {
					this.ok();
				} else {
					this.cancel();
				}
			});
		});

		return button;
	}

	public get options(): { [name: string]: string } {
		return this._options;
	}

	public hideError() {
		this._dialog.showError('');
	}

	public showError(err: string) {
		this._dialog.showError(err);
	}

	public ok(): void {
		var errorMsg = AdvancedPropertiesHelper.validateInputs(this._advancedPropertiesMap);
		if (DialogHelper.isEmptyString(errorMsg)) {
			AdvancedPropertiesHelper.updateProperties(this._options, this._advancedPropertiesMap);
			this._callbacks.onOk();
			this.close();
		} else {
			this.showError(errorMsg);
		}

	}

	public cancel() {
		this.close();
	}

	public close() {
		jQuery('#propertiesContent').empty();
		this.dispose();
		jQuery('#advancedDialogModal').modal('hide');
		this._callbacks.onClose();
	}

	public open(connectionPropertiesMaps: { [category: string]: data.ConnectionOption[] }, options: { [name: string]: any }) {
		this._options = options;
		var firstProperty: string;
		var containerGroup: Builder;
		var layoutSize = 0;
		var propertiesContentbuilder: Builder = $().div({ class: 'advancedDialog-properties-groups' }, (container) => {
			containerGroup = container;
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
		jQuery('#propertiesContent').append(propertiesContentbuilder.getHTMLElement());
		jQuery('#advancedDialogModal').modal({ backdrop: false, keyboard: true });
		var firstPropertyWidget = this._advancedPropertiesMap[firstProperty].advancedPropertyWidget;
		firstPropertyWidget.focus();

		this.registerStyling();
		this._builder.on(DOM.EventType.KEY_DOWN, (e: KeyboardEvent) => {
			let event = new StandardKeyboardEvent(e);
			if (event.equals(KeyCode.Enter)) {
				this.ok();
			} else if (event.equals(KeyCode.Escape)) {
				this.cancel();
			}
		});
	}

	public dispose(): void {
		this._builder.off(DOM.EventType.KEY_DOWN);
		this._toDispose = lifecycle.dispose(this._toDispose);
		for (var key in this._advancedPropertiesMap) {
			var widget: Widget = this._advancedPropertiesMap[key].advancedPropertyWidget;
			widget.dispose();
			delete this._advancedPropertiesMap[key];
		}
	}
}