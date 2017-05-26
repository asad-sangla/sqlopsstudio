/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { AdvancedPropertiesHelper, IAdvancedPropertyElement } from 'sql/parts/connection/connectionDialog/advancedPropertiesHelper';
import { ServiceOptionType } from 'sql/parts/connection/common/connectionManagement';
import { InputBox } from 'vs/base/browser/ui/inputbox/inputBox';
import data = require('data');
import { Builder, $ } from 'vs/base/browser/builder';
import * as TypeMoq from 'typemoq';
import * as assert from 'assert';

suite('Advanced properties helper tests', () => {
	var possibleInputs: string[];
	let options: { [name: string]: any };
	var categoryProperty: data.ConnectionOption;
	var booleanProperty: data.ConnectionOption;
	var numberProperty: data.ConnectionOption;
	var stringProperty: data.ConnectionOption;
	var isValid: boolean;
	var inputValue: string;
	var inputBox: TypeMoq.Mock<InputBox>;

	var advancedPropertiesMap: { [propertyName: string]: IAdvancedPropertyElement };

	setup(() => {
		options = {};
		advancedPropertiesMap = {};

		categoryProperty= {
			name: 'applicationIntent',
			displayName: 'Application Intent',
			description: 'Declares the application workload type when connecting to a server',
			groupName: 'Initialization',
			categoryValues: [
			{displayName: 'ReadWrite', name: 'ReadWrite'},
			{displayName: 'ReadOnly', name: 'ReadOnly'}
			],
			defaultValue: null,
			isIdentity: false,
			isRequired: false,
			specialValueType: null,
			valueType: ServiceOptionType.category
		};

		booleanProperty = {
			name: 'asynchronousProcessing',
			displayName: 'Asynchronous processing enabled',
			description: 'When true, enables usage of the Asynchronous functionality in the .Net Framework Data Provider',
			groupName: 'Initialization',
			categoryValues: null,
			defaultValue: null,
			isIdentity: false,
			isRequired: false,
			specialValueType: null,
			valueType: ServiceOptionType.boolean
		};

		numberProperty = {
			name: 'connectTimeout',
			displayName: 'Connect Timeout',
			description: 'The length of time (in seconds) to wait for a connection to the server before terminating the attempt and generating an error',
			groupName: 'Initialization',
			categoryValues: null,
			defaultValue: '15',
			isIdentity: false,
			isRequired: false,
			specialValueType: null,
			valueType: ServiceOptionType.number
		};

		stringProperty = {
			name: 'currentLanguage',
			displayName: 'Current Language',
			description: 'The SQL Server language record name',
			groupName: 'Initialization',
			categoryValues: null,
			defaultValue: null,
			isIdentity: false,
			isRequired: false,
			specialValueType: null,
			valueType: ServiceOptionType.string
		};


		let builder: Builder = $().div();
		inputBox = TypeMoq.Mock.ofType(InputBox, TypeMoq.MockBehavior.Loose, builder.getHTMLElement(), null, null);
		inputBox.callBase = true;
		inputBox.setup(x => x.isInputValid()).returns(() => isValid);
		inputBox.setup(x => x.value).returns( () => inputValue );
	});

	test('create default but not required category properties should set the property value and possible inputs correctly', () => {
		categoryProperty.defaultValue = 'ReadWrite';
		categoryProperty.isRequired = false;
		possibleInputs = [];
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(categoryProperty, options, possibleInputs);
		assert.equal(propertyValue, 'ReadWrite');
		assert.equal(possibleInputs.length, 3);
		assert.equal(possibleInputs[0], '');
		assert.equal(possibleInputs[1], 'ReadWrite');
		assert.equal(possibleInputs[2], 'ReadOnly');
	});

	test('create default and required category properties should set the property value and possible inputs correctly', () => {
		categoryProperty.defaultValue = 'ReadWrite';
		categoryProperty.isRequired = true;
		possibleInputs = [];
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(categoryProperty, options, possibleInputs);
		assert.equal(propertyValue, 'ReadWrite');
		assert.equal(possibleInputs.length, 2);
		assert.equal(possibleInputs[0], 'ReadWrite');
		assert.equal(possibleInputs[1], 'ReadOnly');
	});

	test('create no default and not required category properties should set the property value and possible inputs correctly', () => {
		categoryProperty.defaultValue = null;
		categoryProperty.isRequired = false;
		possibleInputs = [];
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(categoryProperty, options, possibleInputs);
		assert.equal(propertyValue, '');
		assert.equal(possibleInputs.length, 3);
		assert.equal(possibleInputs[0], '');
		assert.equal(possibleInputs[1], 'ReadWrite');
		assert.equal(possibleInputs[2], 'ReadOnly');
	});

	test('create no default but required category properties should set the property value and possible inputs correctly', () => {
		categoryProperty.defaultValue = null;
		categoryProperty.isRequired = true;
		possibleInputs = [];
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(categoryProperty, options, possibleInputs);
		assert.equal(propertyValue, 'ReadWrite');
		assert.equal(possibleInputs.length, 2);
		assert.equal(possibleInputs[0], 'ReadWrite');
		assert.equal(possibleInputs[1], 'ReadOnly');
	});

	test('create not required category properties with option value should set the property value and possible inputs correctly', () => {
		categoryProperty.defaultValue = null;
		categoryProperty.isRequired = false;
		possibleInputs = [];
		options['applicationIntent'] = 'ReadOnly';
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(categoryProperty, options, possibleInputs);
		assert.equal(propertyValue, 'ReadOnly');
		assert.equal(possibleInputs.length, 3);
		assert.equal(possibleInputs[0], '');
		assert.equal(possibleInputs[1], 'ReadWrite');
		assert.equal(possibleInputs[2], 'ReadOnly');
	});

	test('create required category properties with option value should set the property value and possible inputs correctly', () => {
		categoryProperty.defaultValue = null;
		categoryProperty.isRequired = true;
		possibleInputs = [];
		options['applicationIntent'] = 'ReadOnly';
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(categoryProperty, options, possibleInputs);
		assert.equal(propertyValue, 'ReadOnly');
		assert.equal(possibleInputs.length, 2);
		assert.equal(possibleInputs[0], 'ReadWrite');
		assert.equal(possibleInputs[1], 'ReadOnly');
	});

	test('create default but not required boolean properties should set the property value and possible inputs correctly', () => {
		booleanProperty.defaultValue = 'False';
		booleanProperty.isRequired = false;
		possibleInputs = [];
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(booleanProperty, options, possibleInputs);
		assert.equal(propertyValue, 'False');
		assert.equal(possibleInputs.length, 3);
		assert.equal(possibleInputs[0], '');
		assert.equal(possibleInputs[1], 'True');
		assert.equal(possibleInputs[2], 'False');
	});

	test('create default and required boolean properties should set the property value and possible inputs correctly', () => {
		booleanProperty.defaultValue = 'False';
		booleanProperty.isRequired = true;
		possibleInputs = [];
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(booleanProperty, options, possibleInputs);
		assert.equal(propertyValue, 'False');
		assert.equal(possibleInputs.length, 2);
		assert.equal(possibleInputs[0], 'True');
		assert.equal(possibleInputs[1], 'False');
	});

	test('create no default and not required boolean properties should set the property value and possible inputs correctly', () => {
		booleanProperty.defaultValue = null;
		booleanProperty.isRequired = false;
		possibleInputs = [];
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(booleanProperty, options, possibleInputs);
		assert.equal(propertyValue, '');
		assert.equal(possibleInputs.length, 3);
		assert.equal(possibleInputs[0], '');
		assert.equal(possibleInputs[1], 'True');
		assert.equal(possibleInputs[2], 'False');
	});

	test('create no default but required boolean properties should set the property value and possible inputs correctly', () => {
		booleanProperty.defaultValue = null;
		booleanProperty.isRequired = true;
		possibleInputs = [];
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(booleanProperty, options, possibleInputs);
		assert.equal(propertyValue, 'True');
		assert.equal(possibleInputs.length, 2);
		assert.equal(possibleInputs[0], 'True');
		assert.equal(possibleInputs[1], 'False');
	});

	test('create not required boolean properties with option value should set the property value and possible inputs correctly', () => {
		booleanProperty.defaultValue = null;
		booleanProperty.isRequired = false;
		possibleInputs = [];
		options['asynchronousProcessing'] = true;
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(booleanProperty, options, possibleInputs);
		assert.equal(propertyValue, 'True');
		assert.equal(possibleInputs.length, 3);
		assert.equal(possibleInputs[0], '');
		assert.equal(possibleInputs[1], 'True');
		assert.equal(possibleInputs[2], 'False');
	});

	test('create required boolean properties with option value should set the property value and possible inputs correctly', () => {
		booleanProperty.defaultValue = null;
		booleanProperty.isRequired = true;
		possibleInputs = [];
		options['asynchronousProcessing'] = 'False';
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(booleanProperty, options, possibleInputs);
		assert.equal(propertyValue, 'False');
		assert.equal(possibleInputs.length, 2);
		assert.equal(possibleInputs[0], 'True');
		assert.equal(possibleInputs[1], 'False');
	});

	test('create default number properties should set the property value and possible inputs correctly', () => {
		numberProperty.defaultValue = '15';
		numberProperty.isRequired = true;
		possibleInputs = [];
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(numberProperty, options, possibleInputs);
		assert.equal(propertyValue, '15');
	});

	test('create number properties with option value should set the property value and possible inputs correctly', () => {
		numberProperty.defaultValue = '15';
		numberProperty.isRequired = false;
		possibleInputs = [];
		options['connectTimeout'] = '45';
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(numberProperty, options, possibleInputs);
		assert.equal(propertyValue, '45');
	});

	test('create default string properties should set the property value and possible inputs correctly', () => {
		stringProperty.defaultValue = 'Japanese';
		stringProperty.isRequired = true;
		possibleInputs = [];
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(stringProperty, options, possibleInputs);
		assert.equal(propertyValue, 'Japanese');
	});

	test('create string properties with option value should set the property value and possible inputs correctly', () => {
		stringProperty.defaultValue = 'Japanese';
		stringProperty.isRequired = false;
		possibleInputs = [];
		options['currentLanguage'] = 'Spanish';
		var propertyValue = AdvancedPropertiesHelper.getPropertyValueAndCategorieValues(stringProperty, options, possibleInputs);
		assert.equal(propertyValue, 'Spanish');
	});

	test('validate undefined and optional number input should return no error', () => {
		isValid = true;
		inputValue = '';
		numberProperty.isRequired = false;
		advancedPropertiesMap = {};
		advancedPropertiesMap['connectTimeout'] = {
			advancedPropertyWidget: inputBox.object,
			advancedProperty: numberProperty,
			propertyValue: null
		};

		var error = AdvancedPropertiesHelper.validateInputs(advancedPropertiesMap);
		assert.equal(error, '');
	});

	test('validate a valid optional number input should return no error', () => {
		isValid = true;
		inputValue = '30';
		numberProperty.isRequired = false;
		advancedPropertiesMap = {};
		advancedPropertiesMap['connectTimeout'] = {
			advancedPropertyWidget: inputBox.object,
			advancedProperty: numberProperty,
			propertyValue: null
		};

		var error = AdvancedPropertiesHelper.validateInputs(advancedPropertiesMap);
		assert.equal(error, '');
	});

	test('validate a valid required number input should return no error', () => {
		isValid = true;
		inputValue = '30';
		numberProperty.isRequired = true;
		advancedPropertiesMap = {};
		advancedPropertiesMap['connectTimeout'] = {
			advancedPropertyWidget: inputBox.object,
			advancedProperty: numberProperty,
			propertyValue: null
		};
		var error = AdvancedPropertiesHelper.validateInputs(advancedPropertiesMap);
		assert.equal(error, '');
	});

	test('validate invalid optional number property should return an expected error', () => {
		isValid = false;
		inputValue = 'abc';
		numberProperty.isRequired = false;
		advancedPropertiesMap = {};
		advancedPropertiesMap['connectTimeout'] = {
			advancedPropertyWidget: inputBox.object,
			advancedProperty: numberProperty,
			propertyValue: null
		};

		var error = AdvancedPropertiesHelper.validateInputs(advancedPropertiesMap);
		assert.equal(error, 'Connect Timeout: Requires number as an input.\n');
	});

	test('validate required optional number property should return an expected error', () => {
		isValid = true;
		inputValue = '';
		numberProperty.isRequired = true;
		advancedPropertiesMap = {};
		advancedPropertiesMap['connectTimeout'] = {
			advancedPropertyWidget: inputBox.object,
			advancedProperty: numberProperty,
			propertyValue: null
		};

		var error = AdvancedPropertiesHelper.validateInputs(advancedPropertiesMap);
		assert.equal(error, 'Connect Timeout: Cannot be empty.\n');
	});

	test('update properties should delete option entry if the input value is an empty string', () => {
		isValid = true;
		inputValue = '';
		numberProperty.isRequired = false;
		advancedPropertiesMap = {};
		advancedPropertiesMap['connectTimeout'] = {
			advancedPropertyWidget: inputBox.object,
			advancedProperty: numberProperty,
			propertyValue: '45'
		};
		options['connectTimeout'] = '45';
		AdvancedPropertiesHelper.updateProperties(options, advancedPropertiesMap);
		assert.equal(options['connectTimeout'], undefined);
	});

	test('update properties should update correct property value', () => {
		isValid = true;
		inputValue = '50';
		numberProperty.isRequired = false;
		advancedPropertiesMap = {};
		advancedPropertiesMap['connectTimeout'] = {
			advancedPropertyWidget: inputBox.object,
			advancedProperty: numberProperty,
			propertyValue: '45'
		};
		options['connectTimeout'] = '45';
		AdvancedPropertiesHelper.updateProperties(options, advancedPropertiesMap);
		assert.equal(options['connectTimeout'], 50);
	});

	test('update properties should add the property value to options', () => {
		isValid = true;
		inputValue = '50';
		numberProperty.isRequired = false;
		advancedPropertiesMap = {};
		advancedPropertiesMap['connectTimeout'] = {
			advancedPropertyWidget: inputBox.object,
			advancedProperty: numberProperty,
			propertyValue: '45'
		};
		options = {};
		AdvancedPropertiesHelper.updateProperties(options, advancedPropertiesMap);
		assert.equal(options['connectTimeout'], 50);
	});

});