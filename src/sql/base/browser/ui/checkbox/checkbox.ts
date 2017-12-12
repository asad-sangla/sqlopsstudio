/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Event, { Emitter } from 'vs/base/common/event';
import { KeyCode } from 'vs/base/common/keyCodes';
import { Widget } from 'vs/base/browser/ui/widget';

export interface ICheckboxOptions {
	label: string;
	enabled?: boolean;
	checked?: boolean;
	onChange?: (val: boolean) => void;
}

export class Checkbox extends Widget {
	private _el: HTMLInputElement;
	private _label: HTMLSpanElement;

	private _onChange = new Emitter<boolean>();
	public readonly onChange: Event<boolean> = this._onChange.event;

	constructor(container: HTMLElement, opts: ICheckboxOptions) {
		super();

		this._el = document.createElement('input');
		this._el.type = 'checkbox';

		this.onchange(this._el, e => {
			this._onChange.fire(this.checked);
		});

		this.onkeydown(this._el, e => {
			if (e.equals(KeyCode.Enter)) {
				this.checked = !this.checked;
				e.stopPropagation();
			}
		});

		this._label = document.createElement('span');

		this.label = opts.label;
		this.enabled = opts.enabled || true;
		this.checked = opts.checked || false;

		if (opts.onChange) {
			this.onChange(opts.onChange);
		}

		container.appendChild(this._el);
		container.appendChild(this._label);
	}

	public set label(val: string) {
		this._label.innerText = val;
	}

	public set enabled(val: boolean) {
		this._el.disabled = !val;
	}

	public get enabled(): boolean {
		return !this._el.disabled;
	}

	public set checked(val: boolean) {
		this._el.checked = val;
	}

	public get checked(): boolean {
		return this._el.checked;
	}

	public focus(): void {
		this._el.focus();
	}

	public disable(): void {
		this.enabled = false;
	}

	public enable(): void {
		this.enabled = true;
	}
}
