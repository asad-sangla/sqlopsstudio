/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import vscode = require('vscode');
import * as Constants from './../models/constants';

export default class VscodeWrapper {
    /**
     * Formats and shows a vscode error message
     */
    public showErrorMessage(msg: string, ...items: string[]): Thenable<string> {
        return vscode.window.showErrorMessage(Constants.extensionName + ': ' + msg, ...items);
    }
}
