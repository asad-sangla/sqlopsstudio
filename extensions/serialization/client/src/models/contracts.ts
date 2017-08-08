/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';

import {RequestType} from 'dataprotocol-client';

// DEV-NOTE: Still finalizing what we'll need as part of this interface
/** 
 * Contains necessary information for serializing and saving results
 * @param {string} saveFormat the format / type that the results will be saved in
 * @param {string} savePath path the results will be saved to
 * @param {string} results either a subset or all of the results we wish to save to savePath
 * @param {boolean} appendToFile Whether we should append or overwrite the file in savePath
*/
export class SaveResultsInfo {


    constructor(public saveFormat: string, public savePath: string, public results: string, 
                public appendToFile: boolean) {
    }
}

export namespace SaveAsRequest {
    export const type: RequestType<SaveResultsInfo, boolean, void> = { get method(): string { return 'query/saveAs'; } };
}