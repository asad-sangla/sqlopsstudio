/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { IColorTheme, VS_DARK_THEME, VS_LIGHT_THEME } from 'vs/workbench/services/themes/common/workbenchThemeService';

export class ThemeUtilities {
	public static isDarkTheme(theme: IColorTheme): boolean {
		return theme.id.split(' ')[0] === VS_DARK_THEME;
	}

	public static isLightTheme(theme: IColorTheme): boolean {
		return theme.id.split(' ')[0] === VS_LIGHT_THEME;
	}
}
