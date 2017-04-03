import vscode = require('vscode');
import Constants = require('../models/constants');
import * as ConnectionContracts from '../models/contracts/connection';
import Interfaces = require('../models/interfaces');
import * as Utils from '../models/utils';

// Status bar element for each file in the editor
class FileStatusBar {
    // Item for the connection status
    public statusConnection: vscode.StatusBarItem;

    // Item for the query status
    public statusQuery: vscode.StatusBarItem;

    // Item for language service status
    public statusLanguageService: vscode.StatusBarItem;

    // Timer used for displaying a progress indicator on queries
    public progressTimerId: NodeJS.Timer;

    public currentLanguageServiceStatus: string;
}

export default class StatusView implements vscode.Disposable {
    private _statusBars: { [fileUri: string]: FileStatusBar };
    private _lastShownStatusBar: FileStatusBar;

    constructor() {
        this._statusBars = {};
        vscode.window.onDidChangeActiveTextEditor((params) => this.onDidChangeActiveTextEditor(params));
        vscode.workspace.onDidCloseTextDocument((params) => this.onDidCloseTextDocument(params));
    }

    dispose(): void {
        for (let bar in this._statusBars) {
            if (this._statusBars.hasOwnProperty(bar)) {
                this._statusBars[bar].statusConnection.dispose();
                this._statusBars[bar].statusQuery.dispose();
                this._statusBars[bar].statusLanguageService.dispose();
                clearInterval(this._statusBars[bar].progressTimerId);
                delete this._statusBars[bar];
            }
        }
    }

    // Create status bar item if needed
    private createStatusBar(fileUri: string): void {
        let bar = new FileStatusBar();
        bar.statusConnection = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        bar.statusQuery = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        bar.statusLanguageService = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this._statusBars[fileUri] = bar;
    }

    private destroyStatusBar(fileUri: string): void {
        let bar = this._statusBars[fileUri];
        if (bar) {
            if (bar.statusConnection) {
                bar.statusConnection.dispose();
            }
            if (bar.statusQuery) {
                bar.statusQuery.dispose();
            }
            if (bar.statusLanguageService) {
                bar.statusLanguageService.dispose();
            }
            if (bar.progressTimerId) {
                clearInterval(bar.progressTimerId);
            }

            delete this._statusBars[fileUri];
        }
    }

    private getStatusBar(fileUri: string): FileStatusBar {
        if (!(fileUri in this._statusBars)) {
            // Create it if it does not exist
            this.createStatusBar(fileUri);
        }

        let bar = this._statusBars[fileUri];
        if (bar.progressTimerId) {
            clearInterval(bar.progressTimerId);
        }
        return bar;
    }

    public show(fileUri: string): void {
    }

    public notConnected(fileUri: string): void {
    }

    public connecting(fileUri: string, connCreds: Interfaces.IConnectionCredentials): void {
    }

    public connectSuccess(fileUri: string, connCreds: Interfaces.IConnectionCredentials, serverInfo: ConnectionContracts.ServerInfo): void {
    }

    public connectError(fileUri: string, credentials: Interfaces.IConnectionCredentials, error: ConnectionContracts.ConnectionCompleteParams): void {
    }

    public executingQuery(fileUri: string): void {
    }

    public executedQuery(fileUri: string): void {
        let bar = this.getStatusBar(fileUri);
        bar.statusQuery.hide();
    }

    public cancelingQuery(fileUri: string): void {
        let bar = this.getStatusBar(fileUri);
        bar.statusQuery.hide();

        bar.statusQuery.command = undefined;
        bar.statusQuery.tooltip = Constants.cancelingQueryLabel;
        this.showStatusBarItem(fileUri, bar.statusQuery);
        this.showProgress(fileUri, Constants.cancelingQueryLabel, bar.statusQuery);
    }

    public languageServiceStatusChanged(fileUri: string, status: string): void {
        let bar = this.getStatusBar(fileUri);
        bar.currentLanguageServiceStatus = status;
        this.updateStatusMessage(status,
        () => { return bar.currentLanguageServiceStatus; }, (message) => {
            bar.statusLanguageService.text = message;
            this.showStatusBarItem(fileUri, bar.statusLanguageService);
        });
    }

    public updateStatusMessage(
        newStatus: string,
        getCurrentStatus: () => string,
        updateMessage:  (message: string) => void): void {
    }

    /**
     * Associate a new uri with an existing Uri's status bar
     *
     * @param existingUri The already existing URI's status bar you want to associated
     * @param newUri The new URI you want to associate with the existing status bar
     * @return True or False whether the association was able to be made. False indicated the exitingUri specified
     * did not exist
     */

    public associateWithExisting(existingUri: string, newUri: string): boolean {
        let bar = this.getStatusBar(existingUri);
        if (bar) {
            this._statusBars[newUri] = bar;
            return true;
        } else {
            return false;
        }
    }

    private hideLastShownStatusBar(): void {
        if (typeof this._lastShownStatusBar !== 'undefined') {
            this._lastShownStatusBar.statusConnection.hide();
            this._lastShownStatusBar.statusQuery.hide();
            this._lastShownStatusBar.statusLanguageService.hide();
        }
    }

    private onDidChangeActiveTextEditor(editor: vscode.TextEditor): void {
        // Hide the most recently shown status bar
        this.hideLastShownStatusBar();

        // Change the status bar to match the open file
        if (typeof editor !== 'undefined') {
            const fileUri = editor.document.uri.toString();
            const bar = this._statusBars[fileUri];
            if (bar) {
                this.showStatusBarItem(fileUri, bar.statusConnection);
                this.showStatusBarItem(fileUri, bar.statusLanguageService);
            }
        }
    }

    private onDidCloseTextDocument(doc: vscode.TextDocument): void {
        // Remove the status bar associated with the document
        this.destroyStatusBar(doc.uri.toString());
    }

    private showStatusBarItem(fileUri: string, statusBarItem: vscode.StatusBarItem): void {
        let currentOpenFile = Utils.getActiveTextEditorUri();

        // Only show the status bar if it matches the currently open file and is not empty
        if (fileUri === currentOpenFile && !Utils.isEmpty(statusBarItem.text) ) {
            statusBarItem.show();
            if (fileUri in this._statusBars) {
                this._lastShownStatusBar = this._statusBars[fileUri];
            }
        } else {
            statusBarItem.hide();
        }
    }

    private showProgress(fileUri: string, statusText: string, statusBarItem: vscode.StatusBarItem): void {
    }
}
