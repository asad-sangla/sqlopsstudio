/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Prompt from 'sql/parts/common/prompts/adapter';
import { QuestionTypes, IQuestion, IPrompter } from 'sql/parts/common/prompts/question';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';

import nls = require('vs/nls');
import { Action} from 'vs/base/common/actions';
import { TPromise } from 'vs/base/common/winjs.base';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IMessageService, Severity } from 'vs/platform/message/common/message';

/**
 * Locates the active editor and calls runQuery() on the editor if it is a QueryEditor.
 */
export class ClearRecentConnectionsAction extends Action {

	public static ID = 'clearRecentConnectionsAction';
	public static LABEL = nls.localize('ClearRecentlyUsedLabel', 'Clear Recent Connections List');

    private _prompter: IPrompter;

	constructor(
		id: string,
		label: string,
        @IInstantiationService private _instantiationService: IInstantiationService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
        @IMessageService private _messageService: IMessageService
	) {
		super(id, label);
		this.enabled = true;
	}

	public run(): TPromise<void> {
		let self = this;
		return self.promptToClearRecentConnectionsList().then(result => {
			if (result) {
				self._connectionManagementService.clearRecentConnectionsList();
				self._messageService.show(Severity.Info, nls.localize('ClearedRecentConnections', 'Recent connections list cleared'));
			}
		});
	}

    private get prompter(): IPrompter {
        if (!this._prompter) {
            this._prompter = this._instantiationService.createInstance(Prompt);
        }
        return this._prompter;
    }

    private promptToClearRecentConnectionsList(): TPromise<boolean> {
        const self = this;
        return new TPromise<boolean>((resolve, reject) => {
            let question: IQuestion = {
                type: QuestionTypes.confirm,
                name: ClearRecentConnectionsAction.LABEL,
                message: ClearRecentConnectionsAction.LABEL
            };
            self.prompter.promptSingle(question).then(result => {
                resolve(result ? true : false);
            }).catch(err => {
                resolve(false);
            });
        });
    }
}
