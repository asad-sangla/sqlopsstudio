/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IInsightLabel, InsightsConfig } from 'sql/parts/dashboard/widgets/insights/insightsWidget.component';
import InsightsDialog from 'sql/parts/insights/insightsDialog';

import * as assert from 'assert';

suite('Insights Dialog Tests', () => {
	test('does parse condition right', () => {
		// because we are only looking to test 1 function, this class actually doesn't need any input
		let insightsDialog = new InsightsDialog(undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined);

		// because the function we are trying to test is private, we will need to do some javascript trickery to bypass tsc
		let label: IInsightLabel = {
			column: undefined,
			state: [
				{
					condition: {
						if: 'always'
					},
					color: 'green'
				}
			]
		} as IInsightLabel;
		insightsDialog['_insight'] = { type: undefined, details: { label } } as InsightsConfig;
		let result = insightsDialog['calcInsightState']('anything');
		assert.equal(result.val, 'green', 'always Condition did not return val as expected');
		assert.equal(result.type, 'stateColor', 'always Condition did not return type as expected');

		label.state = [
			{
				condition: {
					if: 'equals',
					equals: 'specific value'
				},
				color: 'green'
			}
		];

		insightsDialog['_insight'] = { type: undefined, details: { label } } as InsightsConfig;
		result = insightsDialog['calcInsightState']('specific value');
		assert.equal(result.val, 'green', 'equals condition did not return val as expected');
		assert.equal(result.type, 'stateColor', 'equals condition did not return type as expected');

		label.state = [
			{
				condition: {
					if: 'equals',
					equals: 'specific value'
				},
				color: 'green'
			},
			{
				condition: {
					if: 'equals',
					equals: 'specific value2'
				},
				color: 'red'
			}
		];

		insightsDialog['_insight'] = { type: undefined, details: { label } } as InsightsConfig;
		result = insightsDialog['calcInsightState']('specific value2');
		assert.equal(result.val, 'red', 'equals condition did not return val as expected');
		assert.equal(result.type, 'stateColor', 'equals condition did not return type as expected');

		label.state = [
			{
				condition: {
					if: 'greaterThan',
					equals: '2'
				},
				color: 'green'
			},
			{
				condition: {
					if: 'equals',
					equals: 'specific value2'
				},
				color: 'red'
			}
		];

		insightsDialog['_insight'] = { type: undefined, details: { label } } as InsightsConfig;
		result = insightsDialog['calcInsightState']('3');
		assert.equal(result.val, 'green', 'equals condition did not return val as expected');
		assert.equal(result.type, 'stateColor', 'equals condition did not return type as expected');

		label.state = [
			{
				condition: {
					if: 'greaterThanOrEquals',
					equals: '2'
				},
				color: 'green'
			},
			{
				condition: {
					if: 'equals',
					equals: 'specific value2'
				},
				color: 'red'
			}
		];

		insightsDialog['_insight'] = { type: undefined, details: { label } } as InsightsConfig;
		result = insightsDialog['calcInsightState']('2');
		assert.equal(result.val, 'green', 'equals condition did not return val as expected');
		assert.equal(result.type, 'stateColor', 'equals condition did not return type as expected');

		label.state = [
			{
				condition: {
					if: 'lessThan',
					equals: '8'
				},
				color: 'green'
			},
			{
				condition: {
					if: 'equals',
					equals: 'specific value2'
				},
				color: 'red'
			}
		];

		insightsDialog['_insight'] = { type: undefined, details: { label } } as InsightsConfig;
		result = insightsDialog['calcInsightState']('2');
		assert.equal(result.val, 'green', 'equals condition did not return val as expected');
		assert.equal(result.type, 'stateColor', 'equals condition did not return type as expected');

		label.state = [
			{
				condition: {
					if: 'lessThanOrEquals',
					equals: '8'
				},
				color: 'green'
			},
			{
				condition: {
					if: 'equals',
					equals: 'specific value2'
				},
				color: 'red'
			}
		];

		insightsDialog['_insight'] = { type: undefined, details: { label } } as InsightsConfig;
		result = insightsDialog['calcInsightState']('8');
		assert.equal(result.val, 'green', 'equals condition did not return val as expected');
		assert.equal(result.type, 'stateColor', 'equals condition did not return type as expected');

		label.state = [
			{
				condition: {
					if: 'notEquals',
					equals: '9'
				},
				color: 'green'
			},
			{
				condition: {
					if: 'equals',
					equals: 'specific value2'
				},
				color: 'red'
			}
		];

		insightsDialog['_insight'] = { type: undefined, details: { label } } as InsightsConfig;
		result = insightsDialog['calcInsightState']('8');
		assert.equal(result.val, 'green', 'equals condition did not return val as expected');
		assert.equal(result.type, 'stateColor', 'equals condition did not return type as expected');

		label.state = [
			{
				condition: {
					if: 'notEquals',
					equals: '9'
				},
				color: 'green'
			},
			{
				condition: {
					if: 'always'
				},
				color: 'red'
			}
		];

		insightsDialog['_insight'] = { type: undefined, details: { label } } as InsightsConfig;
		result = insightsDialog['calcInsightState']('9');
		assert.equal(result.val, 'red', 'equals condition did not return val as expected');
		assert.equal(result.type, 'stateColor', 'equals condition did not return type as expected');

	});
});