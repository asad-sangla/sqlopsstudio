/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import ConnectionConstants = require('sql/parts/connection/common/constants');
import { QueryInput } from 'sql/parts/query/common/queryInput';

import { IWorkspaceConfigurationService } from 'vs/workbench/services/configuration/common/configuration';
import { IEditorInput } from 'vs/platform/editor/common/editor';
import URI from 'vs/base/common/uri';

/**
 * Gets the 'sql' configuration section for use in looking up settings. Note that configs under
 * 'mssql' or other sections are not available from this.
 *
 * @export
 * @param {IWorkspaceConfigurationService} workspaceConfigService
 * @param {string} sectionName
 * @returns {*}
 */
export function getSqlConfigSection(workspaceConfigService: IWorkspaceConfigurationService, sectionName: string): any {
	let config = workspaceConfigService.getConfiguration(ConnectionConstants.sqlConfigSectionName);
	return config ? config[sectionName] : {};
}

export function getSqlConfigValue<T>(workspaceConfigService: IWorkspaceConfigurationService, configName: string): T {
	let config = workspaceConfigService.getConfiguration(ConnectionConstants.sqlConfigSectionName);
	return config[configName];
}

export function getEditorUri(input: IEditorInput): string {
	let uri: URI;
	if (input instanceof QueryInput) {
		let queryCast: QueryInput = <QueryInput>input;
		if (queryCast) {
			uri = queryCast.getResource();
		}
	}

	if (uri) {
		return uri.toString();
	}
	return undefined;
}
