/*---------------------------------------------------------------------------------------------
 *  Copyright Copyright (c) 2015 DonJayamanne. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

// This code is originally from https://github.com/DonJayamanne/bowerVSCode
// License: https://github.com/DonJayamanne/bowerVSCode/blob/master/LICENSE

import Prompt from 'sql/parts/common/prompts/prompt';
import EscapeException from 'sql/parts/common/prompts/escapeException';
import { IQuickOpenService, IPickOptions, IPickOpenEntry } from 'vs/platform/quickOpen/common/quickOpen';

import { INameValueChoice } from './question';


export default class ExpandPrompt extends Prompt {

    constructor(question: any,
        @IQuickOpenService quickOpenService: IQuickOpenService
    ) {
        super(question, quickOpenService);
    }

    public render(): any {
        // label indicates this is a quickpick item. Otherwise it's a name-value pair
        if (this._question.choices[0].label) {
            return this.renderQuickPick(this._question.choices);
        } else {
            return this.renderNameValueChoice(this._question.choices);
        }
    }

    private renderQuickPick(choices: IPickOpenEntry[]): any {
        const options: IPickOptions = {
            placeHolder: this._question.message
        };

        return this._quickOpenService.pick(choices, options)
            .then(result => {
                if (result === undefined) {
                    throw new EscapeException();
                }

                return result || false;
            });
    }
    private renderNameValueChoice(choices: INameValueChoice[]): any {
        const choiceMap = this._question.choices.reduce((result, choice) => {
            result[choice.name] = choice.value;
            return result;
        }, {});

        const options: IPickOptions = {
            placeHolder: this._question.message
        };

        return this._quickOpenService.pick(Object.keys(choiceMap), options)
            .then(result => {
                if (result === undefined) {
                    throw new EscapeException();
                }

                // Note: cannot be used with 0 or false responses
                return choiceMap[result] || false;
            });
    }
}
