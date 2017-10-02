/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/firewallRuleDialog';
import { Builder, $ } from 'vs/base/browser/builder';
import * as DOM from 'vs/base/browser/dom';
import { Button } from 'vs/base/browser/ui/button/button';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Event, { Emitter } from 'vs/base/common/event';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { localize } from 'vs/nls';
import { buttonBackground } from 'vs/platform/theme/common/colorRegistry';
import { IWorkbenchThemeService, IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';
import { attachButtonStyler, attachInputBoxStyler } from 'vs/platform/theme/common/styler';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { SIDE_BAR_BACKGROUND } from 'vs/workbench/common/theme';

import { Modal } from 'sql/parts/common/modal/modal';
import { FirewallRuleViewModel } from 'sql/parts/accountManagement/firewallRuleDialog/firewallRuleViewModel';
import { AccountPicker } from 'sql/parts/accountManagement/accountPicker/accountPicker';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { InputBox } from 'sql/base/browser/ui/inputBox/inputBox';
import * as TelemetryKeys from 'sql/common/telemetryKeys';

export class FirewallRuleDialog extends Modal {
	public viewModel: FirewallRuleViewModel;
	private _createButton: Button;
	private _closeButton: Button;
	private _fromRangeinputBox: InputBox;
	private _toRangeinputBox: InputBox;

	private _helpLink: HTMLElement;
	private _IPAddressInput: HTMLElement;
	private _subnetIPRangeInput: HTMLElement;
	private _IPAddressElement: HTMLElement;

	private _onCreateFirewallRule = new Emitter<void>();
	public onCreateFirewallRule: Event<void> = this._onCreateFirewallRule.event;

	private _onCancel = new Emitter<void>();
	public onCancel: Event<void> = this._onCancel.event;

	constructor(
		@IPartService partService: IPartService,
		@IWorkbenchThemeService private _themeService: IWorkbenchThemeService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IContextViewService private _contextViewService: IContextViewService,
		@ITelemetryService telemetryService: ITelemetryService
	) {
		super(localize('createNewFirewallRule', 'Create new firewall rule'), TelemetryKeys.FireWallRule, partService, telemetryService, { isFlyout: true, hasBackButton: true });

		// view model
		this.viewModel = this._instantiationService.createInstance(FirewallRuleViewModel);
	}

	public render() {
		super.render();
		attachModalDialogStyler(this, this._themeService);
		this.backButton.addListener('click', () => this.cancel());
		this._register(attachButtonStyler(this.backButton, this._themeService, { buttonBackground: SIDE_BAR_BACKGROUND, buttonHoverBackground: SIDE_BAR_BACKGROUND }));
		this._createButton = this.addFooterButton(localize('ok', 'OK'), () => this.createFirewallRule());
		this._closeButton = this.addFooterButton(localize('cancel', 'Cancel'), () => this.cancel());
		this.registerListeners();
	}

	protected renderBody(container: HTMLElement) {
		let descriptionSection;
		$().div({ class: 'firewall-rule-description-section new-section' }, (descriptionContainer) => {
			descriptionSection = descriptionContainer.getHTMLElement();
			DOM.append(descriptionContainer.getHTMLElement(), DOM.$('div.firewall-rule-icon'));

			const textDescriptionContainer = DOM.append(descriptionContainer.getHTMLElement(), DOM.$('div.firewall-rule-description'));
			let dialogDescription = localize('firewallRuleDialogDescription',
				'Your client IP address does not have access to the server. Sign in to an Azure account and create a new firewall rule to enable access.');
			this.createLabelElement(new Builder(textDescriptionContainer), dialogDescription, false);
			this._helpLink = DOM.append(textDescriptionContainer, DOM.$('a.help-link'));
			this._helpLink.setAttribute('href', 'https://docs.microsoft.com/en-us/azure/sql-database/sql-database-firewall-configure');
			this._helpLink.innerHTML += localize('firewallRuleHelpDescription', 'Learn more about firewall settings');
		});

		let azureAccountSection;
		$().div({ class: 'azure-account-section new-section' }, (azureAccountContainer) => {
			azureAccountSection = azureAccountContainer.getHTMLElement();
			let azureAccountLabel = localize('azureAccount', 'Azure account');
			this.createLabelElement(azureAccountContainer, azureAccountLabel, true);
			azureAccountContainer.div({ class: 'dialog-input' }, (inputCellContainer) => {
				let accountPicker = this._instantiationService.createInstance(AccountPicker);
				accountPicker.render(inputCellContainer.getHTMLElement());
			});
		});

		let subnetIPRangeSection;
		$().div({ class: 'subnet-ip-range-input' }, (subnetIPRangeContainer) => {
			subnetIPRangeSection = subnetIPRangeContainer.getHTMLElement();
			subnetIPRangeContainer.div({ class: 'dialog-input-section' }, (inputContainer) => {
				inputContainer.div({ class: 'dialog-label' }, (labelContainer) => {
					labelContainer.innerHtml(localize('from', 'From'));
				});

				inputContainer.div({ class: 'dialog-input' }, (inputCellContainer) => {
					this._fromRangeinputBox = new InputBox(inputCellContainer.getHTMLElement(), this._contextViewService);
				});

				inputContainer.div({ class: 'dialog-label' }, (labelContainer) => {
					labelContainer.innerHtml(localize('to', 'To'));
				});

				inputContainer.div({ class: 'dialog-input' }, (inputCellContainer) => {
					this._toRangeinputBox = new InputBox(inputCellContainer.getHTMLElement(), this._contextViewService);
				});
			});
		});

		let firewallRuleSection;
		$().div({ class: 'firewall-rule-section new-section' }, (firewallRuleContainer) => {
			firewallRuleSection = firewallRuleContainer.getHTMLElement();
			let firewallRuleLabel = localize('filewallRule', 'Firewall rule');
			this.createLabelElement(firewallRuleContainer, firewallRuleLabel, true);
			firewallRuleContainer.div({ class: 'radio-section' }, (radioContainer) => {
				const form = DOM.append(radioContainer.getHTMLElement(), DOM.$('form.firewall-rule'));
				const IPAddressDiv = DOM.append(form, DOM.$('div.firewall-ip-address dialog-input'));
				const subnetIPRangeDiv = DOM.append(form, DOM.$('div.firewall-subnet-ip-range dialog-input'));

				const IPAddressContainer = DOM.append(IPAddressDiv, DOM.$('div.option-container'));
				this._IPAddressInput = DOM.append(IPAddressContainer, DOM.$('input.option-input'));
				this._IPAddressInput.setAttribute('type', 'radio');
				this._IPAddressInput.setAttribute('name', 'firewallRuleChoice');
				this._IPAddressInput.setAttribute('value', 'ipAddress');
				const IPAddressDescription = DOM.append(IPAddressContainer, DOM.$('div.option-description'));
				IPAddressDescription.innerText = localize('addIPAddressLabel', 'Add my client IP ');
				this._IPAddressElement = DOM.append(IPAddressContainer, DOM.$('div.option-ip-address'));

				const subnetIpRangeContainer = DOM.append(subnetIPRangeDiv, DOM.$('div.option-container'));
				this._subnetIPRangeInput = DOM.append(subnetIpRangeContainer, DOM.$('input.option-input'));
				this._subnetIPRangeInput.setAttribute('type', 'radio');
				this._subnetIPRangeInput.setAttribute('name', 'firewallRuleChoice');
				this._subnetIPRangeInput.setAttribute('value', 'ipRange');
				const subnetIPRangeDescription = DOM.append(subnetIpRangeContainer, DOM.$('div.option-description'));
				subnetIPRangeDescription.innerText = localize('addIpRangeLabel', 'Add my subnet IP range');
				DOM.append(subnetIPRangeDiv, subnetIPRangeSection);
			});
		});

		new Builder(container).div({ class: 'firewall-rule-dialog' }, (builder) => {
			builder.append(descriptionSection);
			builder.append(azureAccountSection);
			builder.append(firewallRuleSection);
		});

		let self = this;
		this._register(self._themeService.onDidColorThemeChange(e => self.updateTheme(e)));
		self.updateTheme(self._themeService.getColorTheme());

		jQuery(this._IPAddressInput).on('click', () => {
			this.onFirewallRuleOptionSelected(true);
		});

		jQuery(this._subnetIPRangeInput).on('click', () => {
			this.onFirewallRuleOptionSelected(false);
		});
	}

	private onFirewallRuleOptionSelected(isIPAddress: boolean) {
		this.viewModel.isIPAddressSelected = isIPAddress;
		if (this._fromRangeinputBox) {
			isIPAddress ? this._fromRangeinputBox.disable() : this._fromRangeinputBox.enable();
		}
		if (this._toRangeinputBox) {
			isIPAddress ? this._toRangeinputBox.disable() : this._toRangeinputBox.enable();
		}
	}

	protected layout(height?: number): void {
		// Nothing currently laid out statically in this class
	}

	private createLabelElement(container: Builder, content: string, isHeader?: boolean) {
		let className = 'dialog-label';
		if (isHeader) {
			className += ' header';
		}
		container.div({ class: className }, (labelContainer) => {
			labelContainer.innerHtml(content);
		});
	}

	// Update theming that is specific to firewall rule flyout body
	private updateTheme(theme: IColorTheme): void {
		let linkColor = theme.getColor(buttonBackground);
		let link = linkColor ? linkColor.toString() : null;
		this._helpLink.style.color = link;
		if (this._helpLink) {
			this._helpLink.style.color = link;
		}
	}

	private registerListeners(): void {
		// Theme styler
		this._register(attachButtonStyler(this._createButton, this._themeService));
		this._register(attachButtonStyler(this._closeButton, this._themeService));
		this._register(attachInputBoxStyler(this._fromRangeinputBox, this._themeService));
		this._register(attachInputBoxStyler(this._toRangeinputBox, this._themeService));

		// handler for from subnet ip range change events
		this._register(this._fromRangeinputBox.onDidChange(IPAddress => {
			this.fromRangeInputChanged(IPAddress);
		}));

		// handler for to subnet ip range change events
		this._register(this._toRangeinputBox.onDidChange(IPAddress => {
			this.toRangeInputChanged(IPAddress);
		}));
	}

	private fromRangeInputChanged(IPAddress: string) {
		this.viewModel.fromSubnetIPRange = IPAddress;
	}

	private toRangeInputChanged(IPAddress: string) {
		this.viewModel.toSubnetIPRange = IPAddress;
	}

	/* Overwrite esapce key behavior */
	protected onClose() {
		this.cancel();
	}

	/* Overwrite enter key behavior */
	protected onAccept() {
		this.createFirewallRule();
	}

	public cancel() {
		this._onCancel.fire();
		this.close();
	}

	public close() {
		this.hide();
	}

	public createFirewallRule() {
		this._onCreateFirewallRule.fire();
	}

	public open() {
		this._IPAddressInput.click();
		this._fromRangeinputBox.setPlaceHolder(this.viewModel.defaultFromSubnetIPRange);
		this._toRangeinputBox.setPlaceHolder(this.viewModel.defaultToSubnetIPRange);
		this._IPAddressElement.innerText = '(' + this.viewModel.defaultIPAddress + ')';

		this.show();
	}
}