/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerInsight } from 'sql/platform/dashboard/common/insightRegistry';

import { IJSONSchema } from 'vs/base/common/jsonSchema';

let countInsightSchema: IJSONSchema = {
	type: 'null'
};

registerInsight('count', '', countInsightSchema);