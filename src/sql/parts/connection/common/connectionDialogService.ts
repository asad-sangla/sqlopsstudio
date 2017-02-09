/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import uri from 'vs/base/common/uri';
import { IQuickNavigateConfiguration, IAutoFocus, IEntryRunContext } from 'vs/base/parts/quickopen/common/quickOpen';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { IRegisteredServersService } from 'sql/parts/connection/common/registeredServers';

export interface IFilePickOpenEntry extends IPickOpenEntry {
	resource: uri;
	isFolder?: boolean;
}

export interface IPickOpenEntry {
	id?: string;
	label: string;
	description?: string;
	detail?: string;
	separator?: ISeparator;
	alwaysShow?: boolean;
	run?: (context: IEntryRunContext) => void;
}

export interface ISeparator {
	border?: boolean;
	label?: string;
}

export interface IPickOptions {

	/**
	 * an optional string to show as place holder in the input box to guide the user what she picks on
	 */
	placeHolder?: string;

	/**
	 * optional auto focus settings
	 */
	autoFocus?: IAutoFocus;

	/**
	 * an optional flag to include the description when filtering the picks
	 */
	matchOnDescription?: boolean;

	/**
	 * an optional flag to include the detail when filtering the picks
	 */
	matchOnDetail?: boolean;

	/**
	 * an optional flag to not close the picker on focus lost
	 */
	ignoreFocusLost?: boolean;
}

export interface IInputOptions {

	/**
	 * the value to prefill in the input box
	 */
	value?: string;

	/**
	 * the text to display underneath the input box
	 */
	prompt?: string;

	/**
	 * an optional string to show as place holder in the input box to guide the user what to type
	 */
	placeHolder?: string;

	/**
	 * set to true to show a password prompt that will not show the typed value
	 */
	password?: boolean;

	ignoreFocusLost?: boolean;

	/**
	 * an optional function that is used to validate user input.
	 */
	validateInput?: (input: string) => TPromise<string>;
}

export interface IShowOptions {
	quickNavigateConfiguration?: IQuickNavigateConfiguration;
}

export const ITempConnectionDialogService = createDecorator<ITempConnectionDialogService>('tempCgulp wonnectionDialogService');

export interface ITempConnectionDialogService {

	_serviceBrand: any;

	showDialog(registeredServersService: IRegisteredServersService): TPromise<void>;
}
