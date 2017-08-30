/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TextResourceEditor } from 'vs/workbench/browser/parts/editor/textResourceEditor';
import { IEditorOptions } from 'vs/editor/common/config/editorOptions';
import * as nls from 'vs/nls';

/**
 * Extension of TextResourceEditor that is always readonly rather than only with non UntitledInputs
 */
export class ReadonlyTextResourceEditor extends TextResourceEditor {

	public static ID = 'workbench.editors.readonlyTextResourceEditor';

	protected getConfigurationOverrides(): IEditorOptions {
		const options = super.getConfigurationOverrides();
		options.readOnly = true;
		options.wordWrap = 'on';
		return options;
	}

	protected getAriaLabel(): string {
		const input = this.input;

		let ariaLabel: string;
		const inputName = input && input.getName();
		ariaLabel = inputName ? nls.localize('readonlyEditorWithInputAriaLabel', "{0}. Readonly text editor.", inputName) : nls.localize('readonlyEditorAriaLabel', "Readonly text editor.");

		return ariaLabel;
	}
}