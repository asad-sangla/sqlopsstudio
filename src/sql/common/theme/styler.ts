/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IThemeService } from 'vs/platform/theme/common/themeService';
import * as cr from 'vs/platform/theme/common/colorRegistry';
import { IThemable, attachStyler } from 'vs/platform/theme/common/styler';
import { IDisposable } from 'vs/base/common/lifecycle';
import { SIDE_BAR_BACKGROUND } from 'vs/workbench/common/theme';

export function attachModalDialogStyler(widget: IThemable, themeService: IThemeService, style?:
	{
		dialogForeground?: cr.ColorIdentifier,
		dialogHeaderAndFooterBackground?: cr.ColorIdentifier,
		dialogBodyBackground?: cr.ColorIdentifier,
	}): IDisposable {
	return attachStyler(themeService, {
		dialogForeground: (style && style.dialogForeground) || cr.foreground,
		dialogBorder: cr.contrastBorder,
		dialogHeaderAndFooterBackground: (style && style.dialogHeaderAndFooterBackground) || SIDE_BAR_BACKGROUND,
		dialogBodyBackground: (style && style.dialogBodyBackground) || cr.editorBackground
	}, widget);
}

export function attachListBoxStyler(widget: IThemable, themeService: IThemeService, style?:
	{
		selectBackground?: cr.ColorIdentifier,
		selectForeground?: cr.ColorIdentifier,
		selectBorder?: cr.ColorIdentifier,
		inputValidationInfoBorder?: cr.ColorIdentifier,
		inputValidationInfoBackground?: cr.ColorIdentifier,
		inputValidationWarningBorder?: cr.ColorIdentifier,
		inputValidationWarningBackground?: cr.ColorIdentifier,
		inputValidationErrorBorder?: cr.ColorIdentifier,
		inputValidationErrorBackground?: cr.ColorIdentifier
	}): IDisposable {
	return attachStyler(themeService, {
		selectBackground: (style && style.selectBackground) || cr.selectBackground,
		selectForeground: (style && style.selectForeground) || cr.selectForeground,
		selectBorder: (style && style.selectBorder) || cr.selectBorder,
		inputValidationInfoBorder: (style && style.inputValidationInfoBorder) || cr.inputValidationInfoBorder,
		inputValidationInfoBackground: (style && style.inputValidationInfoBackground) || cr.inputValidationInfoBackground,
		inputValidationWarningBorder: (style && style.inputValidationWarningBorder) || cr.inputValidationWarningBorder,
		inputValidationWarningBackground: (style && style.inputValidationWarningBackground) || cr.inputValidationWarningBackground,
		inputValidationErrorBorder: (style && style.inputValidationErrorBorder) || cr.inputValidationErrorBorder,
		inputValidationErrorBackground: (style && style.inputValidationErrorBackground) || cr.inputValidationErrorBackground
	}, widget);
}
