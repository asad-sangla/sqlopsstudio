/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import ConnectionConstants = require('sql/parts/connection/common/constants');
import Constants = require('sql/parts/query/common/constants');
import * as Utils from 'sql/parts/connection/common/utils';
import * as WorkbenchUtils from 'sql/parts/common/sqlWorkbenchUtils';
import Prompt from 'sql/parts/common/prompts/adapter';
import { QuestionTypes, IQuestion, IPrompter } from 'sql/parts/common/prompts/question';
import { SaveResultsRequestParams } from 'data';
import { IQueryManagementService } from 'sql/parts/query/common/queryManagement';
import { ISaveRequest } from 'sql/parts/grid/common/interfaces';

import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IMessageService, Severity } from 'vs/platform/message/common/message';
import { IOutputService, IOutputChannel, IOutputChannelRegistry, Extensions as OutputExtensions } from 'vs/workbench/parts/output/common/output';
import { IWorkspaceConfigurationService } from 'vs/workbench/services/configuration/common/configuration';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';
import { IWindowsService } from 'vs/platform/windows/common/windows';
import { Registry } from 'vs/platform/platform';
import URI from 'vs/base/common/uri';
import { IUntitledEditorService } from 'vs/workbench/services/untitled/common/untitledEditorService';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';

import { ISlickRange } from 'angular2-slickgrid';
import path = require('path');
import os = require('os');
import fs = require('fs');
declare let prettyData;

/**
 *  Handles save results request from the context menu of slickGrid
 */
export class ResultSerializer {
    public static tempFileCount: number = 1;

    private static JSON_TYPE: string = 'json';
    private static CSV_TYPE: string = 'csv';
    private static XML_TYPE: string = 'xml';
    private static EXCEL_TYPE: string = 'excel';
    private static FILE_SCHEMA: string = 'file';

    private _prompter: IPrompter;
    private _uri: string;
    private _filePath: string;
    private _isTempFile: boolean;
    private pd: any;

    constructor(
        @IInstantiationService private _instantiationService: IInstantiationService,
        @IMessageService private _messageService: IMessageService,
        @IOutputService private _outputService: IOutputService,
        @IQueryManagementService private _queryManagementService: IQueryManagementService,
        @IWorkspaceConfigurationService private _workspaceConfigurationService: IWorkspaceConfigurationService,
        @IWorkbenchEditorService private _editorService: IWorkbenchEditorService,
        @IWorkspaceContextService private _contextService: IWorkspaceContextService,
        @IWindowsService private _windowsService: IWindowsService,
		@IUntitledEditorService private _untitledEditorService: IUntitledEditorService
    ) {
        if (prettyData) {
            this.pd = prettyData.pd;
        }
    }

    private get prompter(): IPrompter {
        if (!this._prompter) {
            this.ensureOutputChannelExists();
            this._prompter = this._instantiationService.createInstance(Prompt);
        }
        return this._prompter;
    }

    /**
     * Handle save request by getting filename from user and sending request to service
     */
    public saveResults(uri: string, saveRequest: ISaveRequest): Thenable<void> {
        const self = this;
        this._uri = uri;

        // prompt for filepath
        return self.promptForFilepath().then(function (filePath): void {
            if (!Utils.isEmpty(filePath)) {
                self.sendRequestToService(filePath, saveRequest.batchIndex, saveRequest.resultSetNumber, saveRequest.format, saveRequest.selection ? saveRequest.selection[0] : undefined);
            }
        });
    }


    /**
     * Open a xml/json link - Opens the content in a new editor pane
     */
    public openLink(content: string, columnName: string, linkType: string): void {
        let fileMode: string = undefined;

        if (linkType === ResultSerializer.XML_TYPE && this.pd) {
            try {
                content = this.pd.xml(content);
                fileMode = ResultSerializer.XML_TYPE;
            } catch (e) {
                // If Xml fails to parse, fall back on original Xml content
            }
        } else if (linkType === ResultSerializer.JSON_TYPE) {
            let jsonContent: string = undefined;
            try {
                jsonContent = JSON.parse(content);
                fileMode = ResultSerializer.JSON_TYPE;
            } catch (e) {
                // If Json fails to parse, fall back on original Json content
            }
            if (jsonContent) {
                // If Json content was valid and parsed, pretty print content to a string
                content = JSON.stringify(jsonContent, undefined, 4);
            }
        }

        this.openUntitledFile(fileMode, content);
    }

    private ensureOutputChannelExists(): void {
        Registry.as<IOutputChannelRegistry>(OutputExtensions.OutputChannels)
            .registerChannel(ConnectionConstants.outputChannelName, ConnectionConstants.outputChannelName);
    }

    private get outputChannel(): IOutputChannel {
        this.ensureOutputChannelExists();
        return this._outputService.getChannel(ConnectionConstants.outputChannelName);
    }

    private get rootPath(): string {
        return this._contextService.hasWorkspace() ? this._contextService.getWorkspace().resource.fsPath : undefined;
    }

    private logToOutputChannel(message: string): void {
        this.outputChannel.append(message);
    }

    private promptForFilepath(): Promise<string> {
        const self = this;
        let prompted: boolean = false;
        let filepathPlaceHolder = self.resolveCurrentDirectory(self._uri);
        let questions: IQuestion[] = [
            // prompt user to enter file path
            {
                type: QuestionTypes.input,
                name: Constants.filepathPrompt,
                message: Constants.filepathMessage,
                placeHolder: filepathPlaceHolder,
                validate: (value) => this.validateFilePath(Constants.filepathPrompt, value)
            },
            // prompt to overwrite file if file already exists
            {
                type: QuestionTypes.confirm,
                name: Constants.overwritePrompt,
                message: Constants.overwritePrompt,
                placeHolder: Constants.overwritePlaceholder,
                shouldPrompt: (answers) => this.fileExists(answers[Constants.filepathPrompt]),
                onAnswered: (value) => prompted = true
            }
        ];
        return this.prompter.prompt(questions).then(answers => {
            if (answers && answers[Constants.filepathPrompt]) {
                // return filename if file does not exist or if user opted to overwrite file
                if (!prompted || (prompted && answers[Constants.overwritePrompt])) {
                    return answers[Constants.filepathPrompt];
                }
                // call prompt again if user did not opt to overwrite
                if (prompted && !answers[Constants.overwritePrompt]) {
                    return self.promptForFilepath();
                }
            }
            return undefined;
        });
    }

    private fileExists(filePath: string): boolean {
        const self = this;
        // resolve filepath
        if (!path.isAbsolute(filePath)) {
            filePath = self.resolveFilePath(this._uri, filePath);
        }
        if (self._isTempFile) {
            return false;
        }
        // check if file already exists on disk
        try {
            fs.statSync(filePath);
            return true;
        } catch (err) {
            return false;
        }

    }

    private getConfigForCsv(): SaveResultsRequestParams {
        let saveResultsParams = <SaveResultsRequestParams>{ resultFormat: ResultSerializer.CSV_TYPE };

        // get save results config from vscode config
        let saveConfig = WorkbenchUtils.getSqlConfigSection(this._workspaceConfigurationService, Constants.configSaveAsCsv);
        // if user entered config, set options
        if (saveConfig) {
            if (saveConfig.includeHeaders !== undefined) {
                saveResultsParams.includeHeaders = saveConfig.includeHeaders;
            }
        }
        return saveResultsParams;
    }

    private getConfigForJson(): SaveResultsRequestParams {
        // JSON does not currently have special conditions
        let saveResultsParams = <SaveResultsRequestParams>{ resultFormat: ResultSerializer.JSON_TYPE };
        return saveResultsParams;
    }

    private getConfigForExcel(): SaveResultsRequestParams {
        // get save results config from vscode config
        // Note: we are currently using the configSaveAsCsv setting since it has the option mssql.saveAsCsv.includeHeaders
        // and we want to have just 1 setting that lists this.
        let config = this.getConfigForCsv();
        config.resultFormat = ResultSerializer.EXCEL_TYPE;
        return config;
    }

    private resolveCurrentDirectory(uri: string): string {
        const self = this;
        self._isTempFile = false;
        let sqlUri = URI.parse(uri);
        let currentDirectory: string;

        // use current directory of the sql file if sql file is saved
        if (sqlUri.scheme === ResultSerializer.FILE_SCHEMA) {
            currentDirectory = path.dirname(sqlUri.fsPath);
        } else if (sqlUri.scheme === UntitledEditorInput.SCHEMA) {
            // if sql file is unsaved/untitled but a workspace is open use workspace root
            let root = this.rootPath;
            if (root) {
                currentDirectory = root;
            } else {
                // use temp directory
                currentDirectory = os.tmpdir();
                self._isTempFile = true;
            }
        } else {
            currentDirectory = path.dirname(sqlUri.path);
        }
        return currentDirectory;
    }

    private resolveFilePath(uri: string, filePath: string): string {
        let currentDirectory = this.resolveCurrentDirectory(uri);
        return path.normalize(path.join(currentDirectory, filePath));
    }

    private validateFilePath(property: string, value: string): string {
        if (Utils.isEmpty(value.trim())) {
            return property + ConnectionConstants.msgIsRequired;
        }
        return undefined;
    }

    private getParameters(filePath: string, batchIndex: number, resultSetNo: number, format: string, selection: ISlickRange): SaveResultsRequestParams {
        let saveResultsParams: SaveResultsRequestParams;
        if (!path.isAbsolute(filePath)) {
            this._filePath = this.resolveFilePath(this._uri, filePath);
        } else {
            this._filePath = filePath;
        }

        if (format === ResultSerializer.CSV_TYPE) {
            saveResultsParams = this.getConfigForCsv();
        } else if (format === ResultSerializer.JSON_TYPE) {
            saveResultsParams = this.getConfigForJson();
        } else if (format === ResultSerializer.EXCEL_TYPE) {
            saveResultsParams = this.getConfigForExcel();
        }

        saveResultsParams.filePath = this._filePath;
        saveResultsParams.ownerUri = this._uri;
        saveResultsParams.resultSetIndex = resultSetNo;
        saveResultsParams.batchIndex = batchIndex;
        if (this.isSelected(selection)) {
            saveResultsParams.rowStartIndex = selection.fromRow;
            saveResultsParams.rowEndIndex = selection.toRow;
            saveResultsParams.columnStartIndex = selection.fromCell;
            saveResultsParams.columnEndIndex = selection.toCell;
        }
        return saveResultsParams;
    }

    /**
     * Check if a range of cells were selected.
     */
    private isSelected(selection: ISlickRange): boolean {
        return (selection && !((selection.fromCell === selection.toCell) && (selection.fromRow === selection.toRow)));
    }

    /**
     * Send request to sql tools service to save a result set
     */
    private sendRequestToService(filePath: string, batchIndex: number, resultSetNo: number, format: string, selection: ISlickRange): Thenable<void> {
        let saveResultsParams = this.getParameters(filePath, batchIndex, resultSetNo, format, selection);

        this.logToOutputChannel(Constants.msgSaveStarted + this._filePath);

        // send message to the sqlserverclient for converting resuts to the requested format and saving to filepath
        return this._queryManagementService.saveResults(saveResultsParams).then(result => {
            if (result.messages) {
                this._messageService.show(Severity.Error, Constants.msgSaveFailed + result.messages);
                this.logToOutputChannel(Constants.msgSaveFailed + result.messages);
            } else {
                this._messageService.show(Severity.Info, Constants.msgSaveSucceeded + this._filePath);
                this.logToOutputChannel(Constants.msgSaveSucceeded + filePath);
                this.openSavedFile(this._filePath, format);
            }
            // TODO telemetry for save results
            // Telemetry.sendTelemetryEvent('SavedResults', { 'type': format });

        }, error => {
            this._messageService.show(Severity.Error, Constants.msgSaveFailed + error);
            this.logToOutputChannel(Constants.msgSaveFailed + error);
        });
    }

    /**
     * Open the saved file in a new vscode editor pane
     */
    private openSavedFile(filePath: string, format: string): void {
        if (format === ResultSerializer.EXCEL_TYPE) {
            // This will not open in VSCode as it's treated as binary. Use the native file opener instead
            // Note: must use filePath here, URI does not open correctly
            // TODO see if there is an alternative opener that includes error handling
            let fileUri = URI.from({ scheme: ResultSerializer.FILE_SCHEMA, path: filePath });
            this._windowsService.openExternal(fileUri.toString());
        } else {
            let uri = URI.file(filePath);
            this._editorService.openEditor({ resource: uri }).then((result) => {

            }, (error: any) => {
                this._messageService.show(Severity.Error, error);
            });
        }
    }

    /**
     * Open the saved file in a new vscode editor pane
     */
    private openUntitledFile(fileMode: string, contents: string): void {
		const input = this._untitledEditorService.createOrGet(undefined, fileMode, contents);

		this._editorService.openEditor(input, { pinned: true })
            .then(
                (success) => {
                },
                (error: any) => {
                    this._messageService.show(Severity.Error, error);
                }
            );
    }
}
