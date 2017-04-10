/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import vscode = require('vscode');
import Constants = require('../models/constants');
import Utils = require('../models/utils');
import SqlToolsServerClient from '../languageservice/serviceclient';
import Telemetry from '../models/telemetry';
import VscodeWrapper from './vscodeWrapper';

/**
 * The main controller class that initializes the extension
 */
export default class MainController implements vscode.Disposable {
    private _context: vscode.ExtensionContext;
    private _vscodeWrapper: VscodeWrapper;
    private _initialized: boolean = false;

    /**
     * The main controller constructor
     * @constructor
     */
    constructor(context: vscode.ExtensionContext,
                vscodeWrapper?: VscodeWrapper) {
        this._context = context;
        this._vscodeWrapper = vscodeWrapper || new VscodeWrapper();
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
        Utils.logDebug(Constants.extensionDeactivated);
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
                SqlToolsServerClient.instance.initialize(self._context).then(serverResult => {

                // Initialize telemetry
                Telemetry.initialize(self._context);

                // telemetry for activation
                Telemetry.sendTelemetryEvent('ExtensionActivated', {},
                    { serviceInstalled: serverResult.installedBeforeInitializing ? 1 : 0 }
                );

                Utils.logDebug(Constants.extensionActivated);
                self._initialized = true;
                resolve(true);
            }).catch(err => {
                Telemetry.sendTelemetryEventForException(err, 'initialize');
                reject(err);
            });
        });
    }
}
