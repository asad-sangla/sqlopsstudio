/*---------------------------------------------------------------------------------------------
 *  Copyright Copyright (c) 2015 DonJayamanne. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

// This code is originally from https://github.com/DonJayamanne/bowerVSCode
// License: https://github.com/DonJayamanne/bowerVSCode/blob/master/LICENSE

import Constants = require('sql/parts/connection/common/constants');

import * as nodeUtil from 'util';
import PromptFactory from 'sql/parts/common/prompts/factory';
import EscapeException from 'sql/parts/common/prompts/escapeException';
import { IQuestion, IPrompter, IPromptCallback } from './question';

import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IMessageService, Severity } from 'vs/platform/message/common/message';
import { IOutputService, IOutputChannel, IOutputChannelRegistry, Extensions as OutputExtensions } from 'vs/workbench/parts/output/common/output';
import { Registry } from 'vs/platform/platform';

// Supports simple pattern for prompting for user input and acting on this
export default class Prompt implements IPrompter {

    private outBuffer: string = '';
    private messageLevelFormatters = {};
    constructor(
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IMessageService private _messageService: IMessageService,
		@IOutputService private _outputService: IOutputService
    ) {
    }

	private ensureOutputChannelExists(): void {
		Registry.as<IOutputChannelRegistry>(OutputExtensions.OutputChannels)
			.registerChannel(Constants.outputChannelName, Constants.outputChannelName);
	}

	private get outputChannel(): IOutputChannel {
		this.ensureOutputChannelExists();
		return this._outputService.getChannel(Constants.outputChannelName);
	}

    public logError(message: any): void {
        let line = `error: ${message.message}\n    Code - ${message.code}`;

        this.outBuffer += `${line}\n`;
        this.outputChannel.append(line);
    }

    private formatMessage(message: any): string {
        const prefix = `${message.level}: (${message.id}) `;
        return `${prefix}${message.message}`;
    }

    public log(message: any): void {
        let line: string = '';
        if (message && typeof (message.level) === 'string') {
            let formatter: (a: any) => string = this.formatMessage;
            if (this.messageLevelFormatters[message.level]) {
                formatter = this.messageLevelFormatters[message.level];
            }
            line = formatter(message);
        } else {
            line = nodeUtil.format(arguments);
        }

        this.outBuffer += `${line}\n`;
        this.outputChannel.append(line);
    }

    public clearLog(): void {
        this.outputChannel.clear();
    }

    public showLog(): void {
        this.outputChannel.show();
    }

    // TODO define question interface
    private fixQuestion(question: any): any {
        if (question.type === 'checkbox' && Array.isArray(question.choices)) {
            // For some reason when there's a choice of checkboxes, they aren't formatted properly
            // Not sure where the issue is
            question.choices = question.choices.map(item => {
                if (typeof (item) === 'string') {
                    return { checked: false, name: item, value: item };
                } else {
                    return item;
                }
            });
        }
    }

    public promptSingle<T>(question: IQuestion): Promise<T> {
        let questions: IQuestion[] = [question];
        return this.prompt(questions).then(answers => {
            if (answers) {
                return answers[question.name] || undefined;
            }
            return undefined;
        });
    }

    public prompt<T>(questions: IQuestion[]): Promise<{[key: string]: T}> {
        let answers: {[key: string]: T} = {};

        // Collapse multiple questions into a set of prompt steps
        let promptResult: Promise<{[key: string]: T}> = questions.reduce((promise: Promise<{[key: string]: T}>, question: IQuestion) => {
            this.fixQuestion(question);

            return promise.then(() => {
                return PromptFactory.createPrompt(question, this._instantiationService);
            }).then(prompt => {
                if (!question.shouldPrompt || question.shouldPrompt(answers) === true) {
                    return prompt.render().then(result => {
                        answers[question.name] = result;

                        if (question.onAnswered) {
                            question.onAnswered(result);
                        }
                        return answers;
                    });
                }
                return answers;
            });
        }, Promise.resolve());

        return promptResult.catch(err => {
            if (err instanceof EscapeException) {
                return;
            }

            this._messageService.show(Severity.Error, err.message);
        });
    }

    // Helper to make it possible to prompt using callback pattern. Generally Promise is a preferred flow
    public promptCallback(questions: IQuestion[], callback: IPromptCallback): void {
        // Collapse multiple questions into a set of prompt steps
        this.prompt(questions).then(answers => {
            if (callback) {
                callback(answers);
            }
        });
    }
}
