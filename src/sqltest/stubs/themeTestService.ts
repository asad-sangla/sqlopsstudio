/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IThemeService, ITheme, IThemingParticipant } from 'vs/platform/theme/common/themeService';
import { Color } from 'vs/base/common/color';
import { IDisposable } from 'vs/base/common/lifecycle';

export class TestTheme implements ITheme {
	selector: string;
	type: 'light' | 'dark' | 'hc';

	getColor(color: string, useDefault?: boolean): Color {
		throw new Error('Method not implemented.');
	}

	isDefault(color: string): boolean {
		throw new Error('Method not implemented.');
	}
}

const testTheme = new TestTheme();

export class TestThemeService implements IThemeService {

	_serviceBrand: any;

	getTheme(): ITheme {
		return testTheme;
	}

	onThemeChange(participant: IThemingParticipant): IDisposable {
		return { dispose: () => { } };
	}
}