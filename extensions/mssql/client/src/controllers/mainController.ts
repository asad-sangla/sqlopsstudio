/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import vscode = require('vscode');
import { Constants } from '../models/constants';
import {IExtensionConstants, Telemetry, SharedConstants, SqlToolsServiceClient, VscodeWrapper, Utils} from 'extensions-modules';

/**
 * The main controller class that initializes the extension
 */
export default class MainController implements vscode.Disposable {
    private _context: vscode.ExtensionContext;
    private _vscodeWrapper: VscodeWrapper;
    private _initialized: boolean = false;
    private static _extensionConstants: IExtensionConstants = new Constants();
    /**
     * The main controller constructor
     * @constructor
     */
    constructor(context: vscode.ExtensionContext,
                vscodeWrapper?: VscodeWrapper) {
        this._context = context;
        this._vscodeWrapper = vscodeWrapper || new VscodeWrapper(MainController._extensionConstants);
        SqlToolsServiceClient.constants = MainController._extensionConstants;

    }

    /**
     * Disposes the controller
     */
    dispose(): void {
        this.deactivate();
    }

    /**
     * Deactivates the extension
     */
    public deactivate(): void {
        Utils.logDebug(SharedConstants.extensionDeactivated, MainController._extensionConstants.extensionConfigSectionName);
    }

    /**
     * Initializes the extension
     */
    public activate():  Promise<boolean> {
        return this.initialize();
    }

    /**
     * Returns a flag indicating if the extension is initialized
     */
    public isInitialized(): boolean {
        return this._initialized;
    }

    /**
     * Initializes the extension
     */
    public initialize(): Promise<boolean> {
        const self = this;

        // initialize language service client
        return new Promise<boolean>( (resolve, reject) => {
                SqlToolsServiceClient.instance.initialize(self._context).then(serverResult => {

                // Initialize telemetry
                Telemetry.initialize(self._context, new Constants());

                // telemetry for activation
                Telemetry.sendTelemetryEvent('ExtensionActivated', {},
                    { serviceInstalled: serverResult.installedBeforeInitializing ? 1 : 0 }
                );

                Utils.logDebug(SharedConstants.extensionActivated, MainController._extensionConstants.extensionConfigSectionName);
                self._initialized = true;
                resolve(true);
            }).catch(err => {
                Telemetry.sendTelemetryEventForException(err, 'initialize', MainController._extensionConstants.extensionConfigSectionName);
                reject(err);
            });
        });
    }
}
