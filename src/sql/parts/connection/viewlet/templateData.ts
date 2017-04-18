/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { InputBox } from 'vs/base/browser/ui/inputbox/inputBox';

export interface IConnectionTemplateData {
	root: HTMLElement;
	serverName: HTMLSpanElement;
	type: HTMLElement;
	footer: HTMLElement;
	databaseName: HTMLElement;
	icon: HTMLElement;
	details: HTMLElement;
	header: HTMLElement;
	headerContainer: HTMLElement;
	connectionProfile: ConnectionProfile;
}

export interface IConnectionProfileGroupTemplateData {
	root: HTMLElement;
	name: HTMLSpanElement;
	inputBox: InputBox;
}