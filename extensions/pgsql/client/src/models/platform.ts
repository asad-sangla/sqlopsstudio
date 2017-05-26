/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as child_process from 'child_process';
import * as fs from 'fs';
import * as os from 'os';

const unknown = 'unknown';

export enum Runtime {
    UnknownRuntime = <any>'Unknown',
    UnknownVersion = <any>'Unknown',
    Windows_64 = <any>'Windows_64',
    Windows_86 = <any>'Windows_86',
    OSX = <any>'OSX',
    Linux_64 = <any>'Linux_64',
    Linux_86 = <any>'Linux_86'
}

export class PlatformInformation {
    public runtimeId: Runtime;

    public constructor(
        public platform: string,
        public architecture: string) {
        try {
            this.runtimeId = PlatformInformation.getRuntimeId(platform, architecture);
        } catch (err) {
            this.runtimeId = undefined;
        }
    }

    public isWindows(): boolean {
        return this.platform === 'win32';
    }

    public isMacOS(): boolean {
        return this.platform === 'darwin';
    }

    public isLinux(): boolean {
        return this.platform === 'linux';
    }

    public isValidRuntime(): boolean {
        return this.runtimeId !== undefined && this.runtimeId !== Runtime.UnknownRuntime && this.runtimeId !== Runtime.UnknownVersion;
    }

    public getRuntimeDisplayName(): string {
        return this.runtimeId.toString();
    }

    public toString(): string {
        let result = this.platform;

        if (this.architecture) {
            if (result) {
                result += ', ';
            }

            result += this.architecture;
        }

        return result;
    }

    public static GetCurrent(): Promise<PlatformInformation> {
        let platform = os.platform();
        let architecturePromise: Promise<string>;

        switch (platform) {
            case 'win32':
                architecturePromise = PlatformInformation.GetWindowsArchitecture();
                break;

            case 'darwin':
            case 'linux':
                architecturePromise = PlatformInformation.GetUnixArchitecture();
                break;

            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }

        return architecturePromise.then( arch => {
            return new PlatformInformation(platform, arch);
        });
    }

    private static GetWindowsArchitecture(): Promise<string> {
        return this.execChildProcess('wmic os get osarchitecture')
            .then(architecture => {
                if (architecture) {
                    let archArray: string[] = architecture.split(os.EOL);
                    if (archArray.length >= 2) {
                        let arch = archArray[1].trim();

                        // Note: This string can be localized. So, we'll just check to see if it contains 32 or 64.
                        if (arch.indexOf('64') >= 0) {
                            return 'x86_64';
                        } else if (arch.indexOf('32') >= 0) {
                            return 'x86';
                        }
                    }
                }

                return unknown;
            }).catch((error) => {
                return unknown;
            });
    }

    private static GetUnixArchitecture(): Promise<string> {
        return this.execChildProcess('uname -m')
            .then(architecture => {
                if (architecture) {
                    return architecture.trim();
                }

                return undefined;
            });
    }

    private static execChildProcess(process: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            child_process.exec(process, { maxBuffer: 500 * 1024 }, (error: Error, stdout: string, stderr: string) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (stderr && stderr.length > 0) {
                    reject(new Error(stderr));
                    return;
                }

                resolve(stdout);
            });
        });
    }

    /**
     * Returns a runtime ID for the current platform
     */
    private static getRuntimeId(platform: string, architecture: string): Runtime {
        switch (platform) {
            case 'win32':
                if (architecture === 'x86_64') {
                    return Runtime.Windows_64;
                } else {
                    return Runtime.Windows_86;
                }

            case 'darwin':
                if (architecture === 'x86_64') {
                    return Runtime.OSX;
                }

                throw new Error(`Unsupported macOS architecture: ${architecture}`);

            case 'linux':
                if (architecture === 'x86_64') {
                    return Runtime.Linux_64;
                } else {
                    return Runtime.Linux_86;
                }

            default:
                 // If we got here, we've ended up with a platform we don't support  like 'freebsd' or 'sunos'.
                 // Chances are, VS Code doesn't support these platforms either.
                 throw Error('Unsupported platform ' + platform);
        }
    }
}
