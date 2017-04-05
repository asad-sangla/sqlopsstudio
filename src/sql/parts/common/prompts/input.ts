/*---------------------------------------------------------------------------------------------
 *  Copyright Copyright (c) 2015 DonJayamanne. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

// This code is originally from https://github.com/DonJayamanne/bowerVSCode
// License: https://github.com/DonJayamanne/bowerVSCode/blob/master/LICENSE

import Prompt from 'sql/parts/common/prompts/prompt';
import EscapeException from 'sql/parts/common/prompts/escapeException';
import { IQuickOpenService, IInputOptions } from 'vs/platform/quickOpen/common/quickOpen';

declare let Figures;

export default class InputPrompt extends Prompt {

    protected _options: IInputOptions;

    constructor(question: any,
        @IQuickOpenService quickOpenService: IQuickOpenService
    ) {
        super(question, quickOpenService);
        this._options = {
            prompt: this._question.message
        };
    }

    // Helper for callers to know the right type to get from the type factory
    public static get promptType(): string { return 'input'; }

    public render(): any {
        // Prefer default over the placeHolder, if specified
        let placeHolder = this._question.default ? this._question.default : this._question.placeHolder;

        if (this._question.default instanceof Error) {
            placeHolder = this._question.default.message;
            this._question.default = undefined;
        }

        this._options.placeHolder = placeHolder;

        return this._quickOpenService.input(this._options)
            .then(result => {
                if (result === undefined) {
                    throw new EscapeException();
                }

                if (result === '') {
                    // Use the default value, if defined
                    result = this._question.default || '';
                }

                const validationError = this._question.validate ? this._question.validate(result || '') : undefined;

                if (validationError) {
                    this._question.default = new Error(`${Figures.warning} ${validationError}`);

                    return this.render();
                }

                return result;
            });
    }
}
