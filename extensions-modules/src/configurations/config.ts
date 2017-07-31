/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
const fs = require('fs');
import * as path from 'path';
import {IConfig} from '../languageservice/interfaces';
import {IExtensionConstants} from '../models/contracts/contracts';
import * as SharedConstants from '../models/constants';

/*
* Config class handles getting values from config.json.
*/
export default class Config implements IConfig {
    private static _configJsonContent: any = undefined;

    private _extensionConfigSectionName: string = undefined;

     constructor(extensionConfigSectionName: string) {
         this._extensionConfigSectionName = extensionConfigSectionName;
     }

    public static get configJsonContent(): any {
        if (this._configJsonContent === undefined) {
            this._configJsonContent = this.loadConfig();
        }
        return this._configJsonContent;
    }

    public getDownloadUrl(): string {
        return this.getConfigValue(SharedConstants.downloadUrlConfigKey);
    }

    public getInstallDirectory(): string {
        return this.getConfigValue(SharedConstants.installDirConfigKey);
    }

    public getPackageDirectory(): string {
        return this.getConfigValue(SharedConstants.packageDirConfigKey);
    }

    public getExecutableFiles(): string[] {
        return this.getConfigValue(SharedConstants.executableFilesConfigKey);
    }

    public getPackageVersion(): string {
        return this.getConfigValue(SharedConstants.versionConfigKey);
    }

    public getConfigValue(configKey: string): any {
        let json = Config.configJsonContent;
        let toolsConfig = json[SharedConstants.serviceConfigKey];
        let configValue: string = undefined;
        if (toolsConfig !== undefined) {
            configValue = toolsConfig[configKey];
        }
        return configValue;
    }

    public getExtensionConfig(key: string, defaultValue?: any): any {
       let json = Config.configJsonContent;
       let extensionConfig = json[this._extensionConfigSectionName];
       let configValue = extensionConfig[key];
       if (!configValue) {
           configValue = defaultValue;
       }
       return configValue;
    }

    public getWorkspaceConfig(key: string, defaultValue?: any): any {
       let json = Config.configJsonContent;
       let configValue = json[key];
       if (!configValue) {
           configValue = defaultValue;
       }
       return configValue;
    }

    static loadConfig(): any {
        let configContent = fs.readFileSync(path.join(__dirname, '../../../../client/out/config.json'));
        return JSON.parse(configContent);
    }
}






