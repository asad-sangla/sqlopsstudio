/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';

import { SaveResultsInfo } from '../models/contracts';

/**
 * Serializer for saving results into a different format
 *
 * @export
 * @interface ISerialization
 */
export interface ISerialization {
    saveAs(saveFormat: string, savePath: string, results: string, appendToFile: boolean): Promise<boolean>;
}
