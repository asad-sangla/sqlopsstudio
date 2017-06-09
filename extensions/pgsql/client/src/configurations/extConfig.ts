/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import Config from  './config';
import { workspace, WorkspaceConfiguration } from 'vscode';
import * as Constants from '../models/constants';
import {IConfig} from '../languageservice/interfaces';

/*
* ExtConfig class handles getting values from workspace config or config.json.
*/
export default class ExtConfig implements IConfig {

    constructor(private _config?: IConfig,
                private _extensionConfig?: WorkspaceConfiguration,
                private _workspaceConfig?: WorkspaceConfiguration) {
        if (this._config === undefined) {
            this._config = new Config();
        }
        if (this._extensionConfig === undefined) {
            this._extensionConfig = workspace.getConfiguration(Constants.extensionConfigSectionName);
        }
        if (this._workspaceConfig === undefined) {
            this._workspaceConfig = workspace.getConfiguration();
        }
    }

    public getPgSqlToolsServiceDownloadUrl(): string {
       return this.getPgSqlToolsConfigValue(Constants.pgSqlToolsServiceDownloadUrlConfigKey);
    }

    public getPgSqlToolsInstallDirectory(): string {
        return this.getPgSqlToolsConfigValue(Constants.pgSqlToolsServiceInstallDirConfigKey);
    }

    public getPgSqlToolsPackageDirectory(): string {
        return this.getPgSqlToolsConfigValue(Constants.pgSqlToolsServicePackageDirConfigKey);
    }

    public getPgSqlToolsExecutableFiles(): string[] {
        return this.getPgSqlToolsConfigValue(Constants.pgSqlToolsServiceExecutableFilesConfigKey);
    }

    public getPgSqlToolsPackageVersion(): string {
        return this.getPgSqlToolsConfigValue(Constants.pgSqlToolsServiceVersionConfigKey);
    }

    public getPgSqlToolsConfigValue(configKey: string): any {
        let configValue: string = <string>this.getExtensionConfig(`${Constants.pgSqlToolsServiceConfigKey}.${configKey}`);
        if (!configValue) {
            configValue = this._config.getPgSqlToolsConfigValue(configKey);
        }
        return configValue;
    }

    public getExtensionConfig(key: string, defaultValue?: any): any {
        let configValue = this._extensionConfig.get(key);
        if (configValue === undefined) {
            configValue = defaultValue;
        }
        return configValue;
    }

    public getWorkspaceConfig(key: string, defaultValue?: any): any {
        let configValue =  this._workspaceConfig.get(key);
        if (configValue === undefined) {
            configValue = defaultValue;
        }
        return configValue;
    }
}







