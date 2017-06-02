/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { Subscription } from 'rxjs/Rx';
import { IDisposable } from 'vs/base/common/lifecycle';

export function toDisposableSubscription(sub: Subscription): IDisposable {
	return {
		dispose: () => {
			sub.unsubscribe();
		}
	};
}