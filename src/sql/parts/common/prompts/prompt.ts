/*---------------------------------------------------------------------------------------------
 *  Copyright Copyright (c) 2015 DonJayamanne. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IQuickOpenService } from 'vs/platform/quickOpen/common/quickOpen';

// This code is originally from https://github.com/DonJayamanne/bowerVSCode
// License: https://github.com/DonJayamanne/bowerVSCode/blob/master/LICENSE

abstract class Prompt {

    constructor(protected _question: any, protected _quickOpenService: IQuickOpenService) {
    }

    public abstract render(): any;
}

export default Prompt;
