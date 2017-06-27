/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { AdvancedPropertiesController } from 'sql/parts/connection/connectionDialog/advancedPropertiesController';
import { AdvancedPropertiesDialog } from 'sql/parts/connection/connectionDialog/advancedPropertiesDialog';
import { Builder, $ } from 'vs/base/browser/builder';
import data = require('data');
import * as TypeMoq from 'typemoq';
import * as assert from 'assert';

suite('Advanced properties dialog tests', () => {
	var advancedController: AdvancedPropertiesController;
	var providerOptions: data.ConnectionOption[];

	setup(() => {
		advancedController = new AdvancedPropertiesController(() => { }, null);
		providerOptions = [
			{
				name: 'a1',
				displayName: undefined,
				description: undefined,
				groupName: 'a',
				categoryValues: undefined,
				defaultValue: undefined,
				isIdentity: true,
				isRequired: true,
				specialValueType: null,
				valueType: 0
			},
			{
				name: 'b1',
				displayName: undefined,
				description: undefined,
				groupName: 'b',
				categoryValues: undefined,
				defaultValue: undefined,
				isIdentity: true,
				isRequired: true,
				specialValueType: null,
				valueType: 0
			},
			{
				name: 'noType',
				displayName: undefined,
				description: undefined,
				groupName: undefined,
				categoryValues: undefined,
				defaultValue: undefined,
				isIdentity: true,
				isRequired: true,
				specialValueType: null,
				valueType: 0
			},
			{
				name: 'a2',
				displayName: undefined,
				description: undefined,
				groupName: 'a',
				categoryValues: undefined,
				defaultValue: undefined,
				isIdentity: true,
				isRequired: true,
				specialValueType: null,
				valueType: 0
			},
			{
				name: 'b2',
				displayName: undefined,
				description: undefined,
				groupName: 'b',
				categoryValues: undefined,
				defaultValue: undefined,
				isIdentity: true,
				isRequired: true,
				specialValueType: null,
				valueType: 0
			}
		];
	});

	test('group connection properties by category should set group and order properties correctly', () => {
		var connectionPropertiesMaps = advancedController.groupConnectionPropertiesByCategory(providerOptions);
		assert.equal(connectionPropertiesMaps['General'].length, 1);
		assert.equal(connectionPropertiesMaps['General'][0].name, 'noType');
		assert.equal(connectionPropertiesMaps['a'].length, 2);
		assert.equal(connectionPropertiesMaps['b'].length, 2);

		var expectedResult = ['a', 'b', 'General'];
		var count = 0;
		//Testing the order of the properties Map
		for (var category in connectionPropertiesMaps) {
			assert.equal(category, expectedResult[count]);
			count++;
		}
	});

	test('advanced dialog should open when showDialog in advancedController get called', () => {
		var isAdvancedDialogCalled = false;
		let options: { [name: string]: any } = {};
		let builder: Builder = $().div();
		let advanceDialog = TypeMoq.Mock.ofType(AdvancedPropertiesDialog, TypeMoq.MockBehavior.Loose, builder.getHTMLElement(), {});
		advanceDialog.setup(x => x.open(TypeMoq.It.isAny(), TypeMoq.It.isAny())).callback(() => {
			isAdvancedDialogCalled = true;
		});
		advancedController.advancedDialog = advanceDialog.object;
		advancedController.showDialog(providerOptions, builder.getHTMLElement(), options);
		assert.equal(isAdvancedDialogCalled, true);
	});
});