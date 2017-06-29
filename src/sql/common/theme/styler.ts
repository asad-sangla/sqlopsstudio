/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IThemeService } from 'vs/platform/theme/common/themeService';
import { foreground, contrastBorder, ColorIdentifier } from 'vs/platform/theme/common/colorRegistry';
import { IThemable, doAttachStyler } from 'vs/platform/theme/common/styler';
import { IDisposable } from 'vs/base/common/lifecycle';
import { SIDE_BAR_BACKGROUND } from 'vs/workbench/common/theme';

export function attachModalDialogStyler(widget: IThemable, themeService: IThemeService, style?:
	{
		dialogForeground?: ColorIdentifier,
		dialogHeaderAndFooterBackground?: ColorIdentifier,
		dialogBodyBackground?: ColorIdentifier,
	}): IDisposable {
	return doAttachStyler(themeService, {
		dialogForeground: (style && style.dialogForeground) || foreground,
		dialogBorder: contrastBorder,
		dialogHeaderAndFooterBackground: (style && style.dialogHeaderAndFooterBackground) || SIDE_BAR_BACKGROUND,
		dialogBodyBackground: (style && style.dialogBodyBackground) || SIDE_BAR_BACKGROUND
	}, widget);
}


