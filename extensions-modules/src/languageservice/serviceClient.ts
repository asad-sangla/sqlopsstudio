/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { ExtensionContext, workspace, window, OutputChannel, languages } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions,
    TransportKind, RequestType, NotificationType, NotificationHandler,
    ErrorAction, CloseAction } from 'dataprotocol-client';

import VscodeWrapper from '../controllers/vscodeWrapper';
import Telemetry from '../models/telemetry';
import * as Utils from '../models/utils';
import {VersionRequest, IExtensionConstants} from '../models/contracts/contracts';
import {Logger} from '../models/logger';
import Constants = require('../models/constants');
import {ILanguageClientHelper} from '../models/contracts/languageService';
import ServerProvider from './server';
import ServiceDownloadProvider from './serviceDownloadProvider';
import DecompressProvider from './decompressProvider';
import HttpClient from './httpClient';
import ExtConfig from  '../configurations/extConfig';
import {PlatformInformation, Runtime} from '../models/platform';
import {ServerInitializationResult, ServerStatusView} from './serverStatus';
import StatusView from '../views/statusView';
import * as LanguageServiceContracts from '../models/contracts/languageService';
import * as SharedConstants from '../models/constants';

let opener = require('opener');
let _channel: OutputChannel = undefined;
const fs = require('fs-extra');

/**
 * @interface IMessage
 */
interface IMessage {
    jsonrpc: string;
}

/**
 * Handle Language Service client errors
 * @class LanguageClientErrorHandler
 */
class LanguageClientErrorHandler {

    private vscodeWrapper: VscodeWrapper;

    /**
     * Creates an instance of LanguageClientErrorHandler.
     * @memberOf LanguageClientErrorHandler
     */
    constructor(constants: IExtensionConstants) {
        if (!this.vscodeWrapper) {
            this.vscodeWrapper = new VscodeWrapper(constants);
        }
        Telemetry.getRuntimeId = this.vscodeWrapper.constants.getRuntimeId;
    }

    /**
     * Show an error message prompt with a link to known issues wiki page
     * @memberOf LanguageClientErrorHandler
     */
    showOnErrorPrompt(): void {
        let extensionConstants = this.vscodeWrapper.constants;
        Telemetry.sendTelemetryEvent(extensionConstants.serviceName + 'Crash');
        this.vscodeWrapper.showErrorMessage(
          extensionConstants.serviceCrashMessage,
          SharedConstants.serviceCrashButton).then(action => {
            if (action && action === SharedConstants.serviceCrashButton) {
                opener(extensionConstants.serviceCrashLink);
            }
        });
    }

    /**
     * Callback for language service client error
     *
     * @param {Error} error
     * @param {Message} message
     * @param {number} count
     * @returns {ErrorAction}
     *
     * @memberOf LanguageClientErrorHandler
     */
    error(error: Error, message: IMessage, count: number): ErrorAction {
        this.showOnErrorPrompt();

        // we don't retry running the service since crashes leave the extension
        // in a bad, unrecovered state
        return ErrorAction.Shutdown;
    }

    /**
     * Callback for language service client closed
     *
     * @returns {CloseAction}
     *
     * @memberOf LanguageClientErrorHandler
     */
    closed(): CloseAction {
        this.showOnErrorPrompt();

        // we don't retry running the service since crashes leave the extension
        // in a bad, unrecovered state
        return CloseAction.DoNotRestart;
    }
}

// The Service Client class handles communication with the VS Code LanguageClient
export default class SqlToolsServiceClient {
    // singleton instance
    private static _instance: SqlToolsServiceClient = undefined;

    private static _constants: IExtensionConstants = undefined;

    public static get constants(): IExtensionConstants {
        return this._constants;
    }

    public static set constants(constantsObject: IExtensionConstants) {
        this._constants = constantsObject;
        Telemetry.getRuntimeId = this._constants.getRuntimeId;
    }

    private static _helper: ILanguageClientHelper = undefined;

    public static get helper(): ILanguageClientHelper {
        return this._helper;
    }

    public static set helper(helperObject: ILanguageClientHelper) {
        this._helper = helperObject;
    }

    // VS Code Language Client
    private _client: LanguageClient = undefined;

    // getter method for the Language Client
    private get client(): LanguageClient {
        return this._client;
    }

    private set client(client: LanguageClient) {
        this._client = client;
    }

    constructor(
        private _server: ServerProvider,
        private _logger: Logger,
        private _statusView: StatusView) {
    }

    // gets or creates the singleton service client instance
    public static get instance(): SqlToolsServiceClient {
        if (this._instance === undefined) {
            let config = new ExtConfig(this._constants.extensionConfigSectionName);
            _channel = window.createOutputChannel(this._constants.serviceInitializingOutputChannelName);
            let logger = new Logger(text => _channel.append(text), this._constants);
            let serverStatusView = new ServerStatusView(this._constants);
            let httpClient = new HttpClient();
            let decompressProvider = new DecompressProvider();
            let downloadProvider = new ServiceDownloadProvider(config, logger, serverStatusView, httpClient,
            decompressProvider, this._constants);
            let serviceProvider = new ServerProvider(downloadProvider, config, serverStatusView);
            let statusView = new StatusView();
            this._instance = new SqlToolsServiceClient(serviceProvider, logger, statusView);
        }
        return this._instance;
    }

    // initialize the Service Client instance by launching
    // out-of-proc server through the LanguageClient
    public initialize(context: ExtensionContext): Promise<ServerInitializationResult> {
         this._logger.appendLine(SqlToolsServiceClient._constants.serviceInitializing);
         return PlatformInformation.GetCurrent(SqlToolsServiceClient._constants.getRuntimeId).then( platformInfo => {
            return this.initializeForPlatform(platformInfo, context);
         });
    }

    /**
     * Copy the packaged service to user directory
     */
    private copyPackagedService(platformInfo: PlatformInformation, context: ExtensionContext): Promise<ServerInitializationResult> {

        let serviceDownloadProvider = this._server.downloadProvider;
        let srcPath = serviceDownloadProvider.getInstallDirectory(platformInfo.runtimeId, true);
        let destPath = serviceDownloadProvider.getInstallDirectory(platformInfo.runtimeId, false);
        console.info('ext: ' +SqlToolsServiceClient._constants.extensionName + 'For extension ', SqlToolsServiceClient._constants.extensionName);
        console.info('ext: ' +SqlToolsServiceClient._constants.extensionName + 'srcPath: ', srcPath);
        console.info('ext: ' +SqlToolsServiceClient._constants.extensionName + 'destPath: ', destPath);
        const self = this;
        return new Promise<ServerInitializationResult>( (resolve, reject) => {
            fs.copy(srcPath, destPath, err => {
                if (err) reject(err);
                this._server.getServerPath(platformInfo.runtimeId).then(destServerPath => {
                    this.initializeLanguageClient(destServerPath, context, platformInfo.runtimeId);
                })
            });
        });
    }

    public initializeForPlatform(platformInfo: PlatformInformation, context: ExtensionContext): Promise<ServerInitializationResult> {
         return new Promise<ServerInitializationResult>( (resolve, reject) => {
            this._logger.appendLine(SqlToolsServiceClient._constants.commandsNotAvailableWhileInstallingTheService);
            this._logger.appendLine();
            this._logger.append(`Platform: ${platformInfo.toString()}`);
            if (!platformInfo.isValidRuntime()) {
                Utils.showErrorMsg(Constants.unsupportedPlatformErrorMessage, SqlToolsServiceClient._constants.extensionName);
                Telemetry.sendTelemetryEvent('UnsupportedPlatform', {platform: platformInfo.toString()} );
                reject('Invalid Platform');
            } else {
                if (platformInfo.runtimeId) {
                    this._logger.appendLine(` (${platformInfo.getRuntimeDisplayName()})`);
                } else {
                    this._logger.appendLine();
                }
                this._logger.appendLine();
                this._server.getServerPath(platformInfo.runtimeId, true).then(serverPackagePath => {
                    // if the service wasn't packaged with installation then
                    // check the user directory
                    if (serverPackagePath === undefined) {
                        this._server.getServerPath(platformInfo.runtimeId).then(serverPath => {
                            if (serverPath === undefined) {
                                // Check if the service already installed and if not open the output channel to show the logs
                                if (_channel !== undefined) {
                                    _channel.show();
                                }
                                this._server.downloadServerFiles(platformInfo.runtimeId).then ( installedServerPath => {
                                    this.initializeLanguageClient(installedServerPath, context, platformInfo.runtimeId);
                                    resolve(new ServerInitializationResult(true, true, installedServerPath));
                                }).catch(downloadErr => {
                                    reject(downloadErr);
                                });
                            } else {
                                this.initializeLanguageClient(serverPath, context, platformInfo.runtimeId);
                                resolve(new ServerInitializationResult(false, true, serverPath));
                            }
                        }).catch(err => {
                            Utils.logDebug(SqlToolsServiceClient._constants.serviceLoadingFailed + ' ' + err, SqlToolsServiceClient._constants.extensionConfigSectionName);
                            Utils.showErrorMsg(SqlToolsServiceClient._constants.serviceLoadingFailed, SqlToolsServiceClient._constants.extensionName);
                            Telemetry.sendTelemetryEvent('ServiceInitializingFailed');
                            reject(err);
                        });
                    } else {
                        // copy the service to user directory if service was
                        // packaged with the installation
                        this.copyPackagedService(platformInfo, context);
                        this._logger.appendLine(SqlToolsServiceClient._constants.extensionName + ' service copied to user local directory');
                    }
                });
            }
        });
    }

    /**
     * Initializes the SQL language configuration
     *
     * @memberOf SqlToolsServiceClient
     */
    private initializeLanguageConfiguration(): void {
        languages.setLanguageConfiguration('sql', {
            comments: {
                lineComment: '--',
                blockComment: ['/*', '*/']
            },

            brackets: [
                ['{', '}'],
                ['[', ']'],
                ['(', ')']
            ],

            __characterPairSupport: {
                autoClosingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    { open: '"', close: '"', notIn: ['string'] },
                    { open: '\'', close: '\'', notIn: ['string', 'comment'] }
                ]
            }
        });
    }

    private initializeLanguageClient(serverPath: string, context: ExtensionContext, runtimeId: Runtime): void {
         if (serverPath === undefined) {
                Utils.logDebug(SqlToolsServiceClient._constants.invalidServiceFilePath, SqlToolsServiceClient._constants.extensionConfigSectionName);
                throw new Error(SqlToolsServiceClient._constants.invalidServiceFilePath);
         } else {
            let self = this;

            if (SqlToolsServiceClient._constants.languageId === 'sql') {
                self.initializeLanguageConfiguration();
            }

            // Use default createServerOptions if one isn't specified
            let serverOptions: ServerOptions = SqlToolsServiceClient._helper ?
                SqlToolsServiceClient._helper.createServerOptions(serverPath, runtimeId) : self.createServerOptions(serverPath);
            this.client = this.createLanguageClient(serverOptions);

            if (context !== undefined) {
                // Create the language client and start the client.
                let disposable = this.client.start();

                // Push the disposable to the context's subscriptions so that the
                // client can be deactivated on extension deactivation

                context.subscriptions.push(disposable);
            }
         }
    }

    private createServerOptions(servicePath): ServerOptions {
        let serverArgs = [];
        let serverCommand: string = servicePath;
        if (servicePath.endsWith('.dll')) {
            serverArgs = [servicePath];
            serverCommand = 'dotnet';
        }

        // Enable diagnostic logging in the service if it is configured
        let config = workspace.getConfiguration(SqlToolsServiceClient._constants.extensionConfigSectionName);
        if (config) {
            let logDebugInfo = config[Constants.configLogDebugInfo];
            if (logDebugInfo) {
                serverArgs.push('--enable-logging');
            }
        }

        // run the service host using dotnet.exe from the path
        let serverOptions: ServerOptions = {  command: serverCommand, args: serverArgs, transport: TransportKind.stdio  };
        return serverOptions;
    }

    private createLanguageClient(serverOptions: ServerOptions): LanguageClient {
        // Options to control the language client
        let clientOptions: LanguageClientOptions = {
            documentSelector: [SqlToolsServiceClient._constants.languageId],
            providerId: SqlToolsServiceClient._constants.providerId,
            synchronize: {
                configurationSection: SqlToolsServiceClient._constants.extensionConfigSectionName
            },
            errorHandler: new LanguageClientErrorHandler(SqlToolsServiceClient._constants)
        };

        // cache the client instance for later use
        let client = new LanguageClient(SqlToolsServiceClient._constants.serviceName, serverOptions, clientOptions);
        client.onReady().then( () => {
            this.checkServiceCompatibility();
            client.onNotification(LanguageServiceContracts.TelemetryNotification.type, this.handleLanguageServiceTelemetryNotification());
            client.onNotification(LanguageServiceContracts.StatusChangedNotification.type, this.handleLanguageServiceStatusNotification());
        });

        return client;
    }

     private handleLanguageServiceTelemetryNotification(): NotificationHandler<LanguageServiceContracts.TelemetryParams> {
        return (event: LanguageServiceContracts.TelemetryParams): void => {
            Telemetry.sendTelemetryEvent(event.params.eventName, event.params.properties, event.params.measures);
        };
    }

    /**
     * Public for testing purposes only.
     */
    public handleLanguageServiceStatusNotification(): NotificationHandler<LanguageServiceContracts.StatusChangeParams> {
        return (event: LanguageServiceContracts.StatusChangeParams): void => {
            this._statusView.languageServiceStatusChanged(event.ownerUri, event.status);
        };
    }

    /**
     * Send a request to the service client
     * @param type The of the request to make
     * @param params The params to pass with the request
     * @returns A thenable object for when the request receives a response
     */
    public sendRequest<P, R, E>(type: RequestType<P, R, E>, params?: P): Thenable<R> {
        if (this.client !== undefined) {
            return this.client.sendRequest(type, params);
        }
    }

    /**
     * Register a handler for a notification type
     * @param type The notification type to register the handler for
     * @param handler The handler to register
     */
    public onNotification<P>(type: NotificationType<P>, handler: NotificationHandler<P>): void {
        if (this._client !== undefined) {
             return this.client.onNotification(type, handler);
        }
    }

    public checkServiceCompatibility(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._client.sendRequest(VersionRequest.type, undefined).then((result) => {
                 Utils.logDebug(SqlToolsServiceClient._constants.extensionName + ' service client version: ' + result, SqlToolsServiceClient._constants.extensionConfigSectionName);

                 if (result === undefined || !result.startsWith(SqlToolsServiceClient._constants.serviceCompatibleVersion)) {
                     Utils.showErrorMsg(Constants.serviceNotCompatibleError, SqlToolsServiceClient._constants.extensionName);
                     Utils.logDebug(Constants.serviceNotCompatibleError, SqlToolsServiceClient._constants.extensionConfigSectionName);
                     resolve(false);
                 } else {
                     resolve(true);
                 }
            });
        });
    }
}
