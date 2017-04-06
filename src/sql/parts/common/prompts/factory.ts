/*---------------------------------------------------------------------------------------------
 *  Copyright Copyright (c) 2015 DonJayamanne. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

// This code is originally from https://github.com/DonJayamanne/bowerVSCode
// License: https://github.com/DonJayamanne/bowerVSCode/blob/master/LICENSE

import Prompt from './prompt';
import InputPrompt from './input';
import PasswordPrompt from './password';
import ListPrompt from './list';
import ConfirmPrompt from './confirm';
import CheckboxPrompt from './checkbox';
import ExpandPrompt from './expand';

import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

export default class PromptFactory {

    public static createPrompt(question: any, instantiationService: IInstantiationService): Prompt {
        /**
         * TODO:
         *   - folder
         */
        switch (question.type || 'input') {
            case 'string':
            case 'input':
                return instantiationService.createInstance(InputPrompt, question);
            case 'password':
                return instantiationService.createInstance(PasswordPrompt, question);
            case 'list':
                return instantiationService.createInstance(ListPrompt, question);
            case 'confirm':
                return instantiationService.createInstance(ConfirmPrompt, question);
            case 'checkbox':
                return instantiationService.createInstance(CheckboxPrompt, question);
            case 'expand':
                return instantiationService.createInstance(ExpandPrompt, question);
            default:
                throw new Error(`Could not find a prompt for question type ${question.type}`);
        }
    }
}
