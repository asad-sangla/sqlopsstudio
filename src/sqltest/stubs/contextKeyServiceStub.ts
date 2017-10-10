/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IContextKeyService, IContextKeyServiceTarget, IContextKey, ContextKeyExpr, IContext } from 'vs/platform/contextkey/common/contextkey';
import Event from 'vs/base/common/event';

export class ContextKeyServiceStub implements IContextKeyService {
	_serviceBrand: any;

	dispose(): void {
		//
	}

	onDidChangeContext: Event<string[]>;

	createKey<T>(key: string, defaultValue: T): IContextKey<T> {
		return undefined;
	}

	contextMatchesRules(rules: ContextKeyExpr): boolean {
		return undefined;
	}

	getContextKeyValue<T>(key: string): T {
		return undefined;
	}

	createScoped(target?: IContextKeyServiceTarget): IContextKeyService {
		return undefined;
	}

	getContext(target: IContextKeyServiceTarget): IContext {
		return undefined;
	}

}