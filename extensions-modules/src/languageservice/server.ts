/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as path from 'path';
import {Runtime} from '../models/platform';
import ServiceDownloadProvider from './serviceDownloadProvider';
import {IConfig, IStatusView} from './interfaces';
let fs = require('fs-extra-promise');


/*
* Service Provider class finds the SQL tools service executable file or downloads it if doesn't exist.
*/
export default class ServerProvider {

    constructor(private _downloadProvider: ServiceDownloadProvider,
                private _config: IConfig,
                private _statusView: IStatusView) {
    }

    /**
     * Public get method for downloadProvider
     */
    public get downloadProvider(): ServiceDownloadProvider {
        return this._downloadProvider;
    }

    /**
     * Given a file path, returns the path to the SQL Tools service file.
     */
    public findServerPath(filePath: string): Promise<string> {
        return fs.lstatAsync(filePath).then(stats => {
            // If a file path was passed, assume its the launch file.
            if (stats.isFile()) {
                return filePath;
            }

            // Otherwise, search the specified folder.
            let candidate: string;

            if (this._config !== undefined) {
                let executableFiles: string[] = this._config.getExecutableFiles();
                executableFiles.forEach(element => {
                    let executableFile = path.join(filePath, element);
                    if (candidate === undefined && fs.existsSync(executableFile)) {
                        candidate = executableFile;
                        return candidate;
                    }
                });
            }

            return candidate;
        });
    }

   /**
    * Download the service if doesn't exist and returns the file path.
    */
    public getOrDownloadServer(runtime: Runtime, packaging?: boolean): Promise<string> {
        // Attempt to find launch file path first from options, and then from the default install location.
        // If SQL tools service can't be found, download it.

        return new Promise<string>((resolve, reject) => {
            return this.getServerPath(runtime, packaging).then(result => {
                if (result === undefined) {
                    return this.downloadServerFiles(runtime, packaging).then ( downloadResult => {
                        resolve(downloadResult);
                    });
                } else {
                  return resolve(result);
                }
            }).catch(err => {
                    return reject(err);
                });
        }).catch(err => {
           throw err;
        });
    }

   /**
    * Returns the path of the installed service
    */
    public getServerPath(runtime: Runtime, packaging?: boolean): Promise<string> {
        const installDirectory = this._downloadProvider.getInstallDirectory(runtime, packaging);
        return this.findServerPath(installDirectory);
    }

   /**
    * Downloads the service and returns the path of the installed service
    */
    public downloadServerFiles(runtime: Runtime, packaging?: boolean): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const installDirectory = this._downloadProvider.getInstallDirectory(runtime, packaging);
            return this._downloadProvider.installService(runtime, packaging).then( _ => {
                return this.findServerPath(installDirectory).then ( result => {
                    return resolve(result);
                });
            }).catch(err => {
                this._statusView.serviceInstallationFailed();
                reject(err);
            });
        });
    }
}