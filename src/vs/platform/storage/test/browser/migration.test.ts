/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as assert from 'assert';
import { StorageService } from 'vs/platform/storage/common/storageService';
import { parseStorage, migrateStorageToMultiRootWorkspace } from 'vs/platform/storage/common/migration';
import URI from 'vs/base/common/uri';
import { StorageScope } from 'vs/platform/storage/common/storage';
import { startsWith } from 'vs/base/common/strings';

suite('Storage Migration', () => {
	let storage = window.localStorage;


	test('Parse Storage (Global)', () => {
		assert.equal(1, 1);
	});
});