/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { registerColor, foreground } from 'vs/platform/theme/common/colorRegistry';
import { Color } from 'vs/base/common/color';
import * as nls from 'vs/nls';

export const tableHeaderBackground = registerColor('table.headerBackground', { dark: Color.white.darken(0.5), light: Color.white.darken(0.5), hc: null }, nls.localize('tableHeaderBackground', 'Table header background color'));
export const tableHeaderForeground = registerColor('table.headerForeground', { dark: Color.black, light: Color.black, hc: null }, nls.localize('tableHeaderForeground', 'Table header foreground color'));
export const disabledInputBackground = registerColor('input.disabled.background', { dark: '#444444', light: '#dcdcdc', hc: Color.black }, nls.localize('disabledInputBoxBackground', "Disabled Input box background."));
export const disabledInputForeground = registerColor('input.disabled.foreground', { dark: '#888888', light: '#888888', hc: foreground }, nls.localize('disabledInputBoxForeground', "Disabled Input box foreground."));