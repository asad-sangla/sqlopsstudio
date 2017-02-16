/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import * as events from 'events';
import vscode = require('vscode');
import Constants = require('../models/constants');
import Utils = require('../models/utils');
import StatusView from '../views/statusView';
import ConnectionManager from './connectionManager';
import SqlToolsServerClient from '../languageservice/serviceclient';
import { IPrompter } from '../prompts/question';
import CodeAdapter from '../prompts/adapter';
import Telemetry from '../models/telemetry';
import VscodeWrapper from './vscodeWrapper';
import UntitledSqlDocumentService from './untitledSqlDocumentService';

/**
 * The main controller class that initializes the extension
 */
export default class MainController implements vscode.Disposable {
    private _context: vscode.ExtensionContext;
    private _event: events.EventEmitter = new events.EventEmitter();
    private _statusview: StatusView;
    private _connectionMgr: ConnectionManager;
    private _prompter: IPrompter;
    private _vscodeWrapper: VscodeWrapper;
    private _initialized: boolean = false;
    private _lastSavedUri: string;
    private _lastSavedTimer: Utils.Timer;
    private _lastOpenedUri: string;
    private _lastOpenedTimer: Utils.Timer;
    private _untitledSqlDocumentService: UntitledSqlDocumentService;

    /**
     * The main controller constructor
     * @constructor
     */
    constructor(context: vscode.ExtensionContext,
                connectionManager?: ConnectionManager,
                vscodeWrapper?: VscodeWrapper) {
        this._context = context;
        if (connectionManager) {
            this._connectionMgr = connectionManager;
        }
        this._vscodeWrapper = vscodeWrapper || new VscodeWrapper();

        this._untitledSqlDocumentService = new UntitledSqlDocumentService(this._vscodeWrapper);
    }

    /**
     * Helper method to setup command registrations
     */
    private registerCommand(command: string): void {
        const self = this;
        this._context.subscriptions.push(vscode.commands.registerCommand(command, () => {
            self._event.emit(command);
        }));
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
        this.onDisconnect();
        this._statusview.dispose();
    }

    /**
     * Initializes the extension
     */
    public activate():  Promise<boolean> {
        let activationTimer = new Utils.Timer();

        // Add handlers for VS Code generated commands
        this._vscodeWrapper.onDidCloseTextDocument(params => this.onDidCloseTextDocument(params));
        this._vscodeWrapper.onDidOpenTextDocument(params => this.onDidOpenTextDocument(params));
        this._vscodeWrapper.onDidSaveTextDocument(params => this.onDidSaveTextDocument(params));

        return this.initialize(activationTimer);
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
    public initialize(activationTimer: Utils.Timer): Promise<boolean> {
        const self = this;

        // initialize language service client
        return new Promise<boolean>( (resolve, reject) => {
                SqlToolsServerClient.instance.initialize(self._context).then(serverResult => {

                // Init status bar
                self._statusview = new StatusView();

                // Init CodeAdapter for use when user response to questions is needed
                self._prompter = new CodeAdapter();

                // Init connection manager and connection MRU
                self._connectionMgr = new ConnectionManager(self._context, self._statusview, self._prompter);

                // Initialize telemetry
                Telemetry.initialize(self._context);

                activationTimer.end();

                // telemetry for activation
                Telemetry.sendTelemetryEvent('ExtensionActivated', {},
                    { activationTime: activationTimer.getDuration(), serviceInstalled: serverResult.installedBeforeInitializing ? 1 : 0 }
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

    /**
     * Choose a new database from the current server
     */
    private onChooseDatabase(): Promise<boolean> {
        if (this.CanRunCommand()) {
            return this._connectionMgr.onChooseDatabase();
        }
    }

    /**
     * Close active connection, if any
     */
    private onDisconnect(): Promise<any> {
        if (this.CanRunCommand()) {
            return this._connectionMgr.onDisconnect();
        }
    }

    /**
     * Manage connection profiles (create, edit, remove).
     */
    private onManageProfiles(): Promise<boolean> {
        if (this.CanRunCommand()) {
            Telemetry.sendTelemetryEvent('ManageProfiles');
            return this._connectionMgr.onManageProfiles();
        }
    }

    /**
     * Let users pick from a list of connections
     */
    public onNewConnection(): Promise<boolean> {
        if (this.CanRunCommand()) {
            return this._connectionMgr.onNewConnection();
        }
    }

    /**
     * Executes a callback and logs any errors raised
     */
    private runAndLogErrors<T>(promise: Promise<T>, handlerName: string): Promise<T> {
        let self = this;
        return promise.catch(err => {
            self._vscodeWrapper.showErrorMessage(Constants.msgError + err);
            Telemetry.sendTelemetryEventForException(err, handlerName);
        });
    }

    /**
     * Access the connection manager for testing
     */
    public get connectionManager(): ConnectionManager {
        return this._connectionMgr;
    }

    public set connectionManager(connectionManager: ConnectionManager) {
        this._connectionMgr = connectionManager;
    }

    public set untitledSqlDocumentService(untitledSqlDocumentService: UntitledSqlDocumentService) {
        this._untitledSqlDocumentService = untitledSqlDocumentService;
    }

    /**
     * Verifies the extension is initilized and if not shows an error message
     */
    private CanRunCommand(): boolean {
        if (this._connectionMgr === undefined) {
            Utils.showErrorMsg(Constants.extensionNotInitializedError);
            return false;
        }
        return true;
    }

    /**
     * Opens a new query and creates new connection
     */
    public onNewQuery(): Promise<boolean> {
        return this._untitledSqlDocumentService.newQuery().then(x => {
            return this._connectionMgr.onNewConnection();
        });
    }

    /**
     * Called by VS Code when a text document closes. This will dispatch calls to other
     * controllers as needed. Determines if this was a normal closed file, a untitled closed file,
     * or a renamed file
     * @param doc The document that was closed
     */
    public onDidCloseTextDocument(doc: vscode.TextDocument): void {
        let closedDocumentUri: string = doc.uri.toString();
        let closedDocumentUriScheme: string = doc.uri.scheme;

        // Stop timers if they have been started
        if (this._lastSavedTimer) {
            this._lastSavedTimer.end();
        }

        if (this._lastOpenedTimer) {
            this._lastOpenedTimer.end();
        }

        // Determine which event caused this close event

        // If there was a saveTextDoc event just before this closeTextDoc event and it
        // was untitled then we know it was an untitled save
        if (this._lastSavedUri &&
                closedDocumentUriScheme === Constants.untitledScheme &&
                this._lastSavedTimer.getDuration() < Constants.untitledSaveTimeThreshold) {
            // Untitled file was saved and connection will be transfered
            this._connectionMgr.transferFileConnection(closedDocumentUri, this._lastSavedUri);

        // If there was an openTextDoc event just before this closeTextDoc event then we know it was a rename
        } else if (this._lastOpenedUri &&
                this._lastOpenedTimer.getDuration() < Constants.renamedOpenTimeThreshold) {
            // File was renamed and connection will be transfered
            this._connectionMgr.transferFileConnection(closedDocumentUri, this._lastOpenedUri);

        } else {
            // Pass along the close event to the other handlers for a normal closed file
            this._connectionMgr.onDidCloseTextDocument(doc);
        }

        // Reset special case timers and events
        this._lastSavedUri = undefined;
        this._lastSavedTimer = undefined;
        this._lastOpenedTimer = undefined;
        this._lastOpenedUri = undefined;
    }

    /**
     * Called by VS Code when a text document is opened. Checks if a SQL file was opened
     * to enable features of our extension for the document.
     */
    public onDidOpenTextDocument(doc: vscode.TextDocument): void {
        this._connectionMgr.onDidOpenTextDocument(doc);

        // Setup properties incase of rename
        this._lastOpenedTimer = new Utils.Timer();
        this._lastOpenedTimer.start();
        this._lastOpenedUri = doc.uri.toString();
    }

    /**
     * Called by VS Code when a text document is saved. Will trigger a timer to
     * help determine if the file was a file saved from an untitled file.
     * @param doc The document that was saved
     */
    public onDidSaveTextDocument(doc: vscode.TextDocument): void {
        let savedDocumentUri: string = doc.uri.toString();

        // Keep track of which file was last saved and when for detecting the case when we save an untitled document to disk
        this._lastSavedTimer = new Utils.Timer();
        this._lastSavedTimer.start();
        this._lastSavedUri = savedDocumentUri;
    }
}