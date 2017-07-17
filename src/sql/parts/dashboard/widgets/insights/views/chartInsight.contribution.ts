/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerInsight } from 'sql/platform/dashboard/common/insightRegistry';

import { IJSONSchema } from 'vs/base/common/jsonSchema';

let chartInsightSchema: IJSONSchema = {
	type: 'object',
	properties: {
		colorMap: {
			type: 'object'
		},
		legendPosition: {
			type: 'string',
			enum: ['top', 'bottom', 'left', 'right', 'none']
		}
	}
};

registerInsight('chart', '', chartInsightSchema);