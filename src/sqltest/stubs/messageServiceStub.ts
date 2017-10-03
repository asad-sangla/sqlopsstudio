/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import Severity from 'vs/base/common/severity';
import { IConfirmation, IMessageService, IMessageWithAction } from 'vs/platform/message/common/message';

export class MessageServiceStub implements IMessageService{
	_serviceBrand: any;

	show(sev: Severity, message: string): () => void;
	show(sev: Severity, message: Error): () => void;
	show(sev: Severity, message: string[]): () => void;
	show(sev: Severity, message: Error[]): () => void;
	show(sev: Severity, message: IMessageWithAction): () => void;
	show(sev: Severity, message): () => void {
		return undefined;
	}

	hideAll(): void {
		return undefined;
	}

	confirm(confirmation: IConfirmation): boolean {
		return undefined;
	}
}