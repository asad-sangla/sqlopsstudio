/*---------------------------------------------------------------------------------------------
 *  Copyright Copyright (c) 2015 DonJayamanne. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

// This code is originally from https://github.com/DonJayamanne/bowerVSCode
// License: https://github.com/DonJayamanne/bowerVSCode/blob/master/LICENSE

import Prompt from 'sql/parts/common/prompts/prompt';
import EscapeException from 'sql/parts/common/prompts/escapeException';
import Constants = require('sql/parts/connection/common/constants');
import { IQuickOpenService, IPickOptions } from 'vs/platform/quickOpen/common/quickOpen';

export default class ListPrompt extends Prompt {

    constructor(question: any,
        @IQuickOpenService quickOpenService: IQuickOpenService
    ) {
        super(question, quickOpenService);
    }

    public render(): any {
        const choices = this._question.choices.reduce((result, choice) => {
            result[choice.name || choice] = choice.value || choice;
            return result;
        }, {});

        const options: IPickOptions = {
             placeHolder: this._question.message
        };

        return this._quickOpenService.pick(Object.keys(choices), options)
            .then(result => {
                if (result === undefined) {
                    throw new EscapeException();
                }

                return choices[result];
            });
    }
}
