/*---------------------------------------------------------------------------------------------
 *  Copyright Copyright (c) 2015 DonJayamanne. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

// This code is originally from https://github.com/DonJayamanne/bowerVSCode
// License: https://github.com/DonJayamanne/bowerVSCode/blob/master/LICENSE

import Prompt from 'sql/parts/common/prompts/prompt';
import EscapeException from 'sql/parts/common/prompts/escapeException';

declare let Figures;

import { IQuickOpenService, IPickOptions } from 'vs/platform/quickOpen/common/quickOpen';

export default class CheckboxPrompt extends Prompt {

    constructor(question: any,
        @IQuickOpenService quickOpenService: IQuickOpenService
    ) {
        super(question, quickOpenService);
    }

    public render(): any {
        let choices = this._question.choices.reduce((result, choice) => {
            let choiceName = choice.name || choice;
            result[`${choice.checked === true ? Figures.radioOn : Figures.radioOff} ${choiceName}`] = choice;
            return result;
        }, {});

        const options: IPickOptions = {
            placeHolder: this._question.message
        };

        let quickPickOptions = Object.keys(choices);
        quickPickOptions.push(Figures.tick);

        return this._quickOpenService.pick(quickPickOptions, options)
            .then(result => {
                if (result === undefined) {
                    throw new EscapeException();
                }

                if (result !== Figures.tick) {
                    choices[result].checked = !choices[result].checked;

                    return this.render();
                }

                return this._question.choices.reduce((result2, choice) => {
                    if (choice.checked === true) {
                        result2.push(choice.value);
                    }

                    return result2;
                }, []);
            });
    }
}
