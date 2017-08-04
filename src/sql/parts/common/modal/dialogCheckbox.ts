/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Builder } from 'vs/base/browser/builder';
import { Checkbox, ICheckboxOpts } from 'vs/base/browser/ui/checkbox/checkbox';

/*
*  Extends Checkbox to support enable/disable the element
*/
export class DialogCheckbox extends Checkbox {
	private _builder: Builder;

	constructor(opts: ICheckboxOpts) {
		super(opts);
		this._builder = new Builder(this.domNode);
	}

	public enable(): void {
		super.enable();
		this._builder.removeClass('disabled');
	}

	public disable(): void {
		super.disable();
		this._builder.addClass('disabled');
	}
}