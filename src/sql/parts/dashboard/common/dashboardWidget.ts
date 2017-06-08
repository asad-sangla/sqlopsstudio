/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { NgGridItemConfig } from 'angular4-grid';

export interface IDashboardWidget {
	load(config: WidgetConfig): boolean;
}

export interface WidgetConfig {
	name?: string;
	icon?: string;
	inverse_icon?: string;
	loadedIcon?: string;
	selector: string;
	context: string;
	gridItemConfig?: NgGridItemConfig;
	config?: any;
	background_color?: string;
	border?: string;
}

export abstract class DashboardWidget {
	protected _config: WidgetConfig;
}