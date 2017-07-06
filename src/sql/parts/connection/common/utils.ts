/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as Constants from 'sql/parts/connection/common/constants';
import { IConnectionProfile, IConnectionProfileStore } from './interfaces';

// CONSTANTS //////////////////////////////////////////////////////////////////////////////////////
const msInH = 3.6e6;
const msInM = 60000;
const msInS = 1000;
export const uriPrefixes = {
	default: 'connection://',
	connection: 'connection://',
	dashboard: 'dashboard://',
	insights: 'insights://'
};


// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////

// Helper to log debug messages
export function logDebug(msg: any): void {
	//let config = vscode.workspace.getConfiguration(Constants.extensionConfigSectionName);
	let logDebugInfo = true; //config[Constants.configLogDebugInfo];
	if (logDebugInfo === true) {
		let currentTime = new Date().toLocaleTimeString();
		let outputMsg = '[' + currentTime + ']: ' + msg ? msg.toString() : '';
		console.log(outputMsg);
	}
}

export function isEmpty(str: any): boolean {
	return (!str || '' === str);
}

export function isNotEmpty(str: any): boolean {
	return <boolean>(str && '' !== str);
}

export function defaultGroupId(): string {
	return 'C777F06B-202E-4480-B475-FA416154D458';
}

// Generate a new GUID
export function generateGuid(): string {
	let hexValues: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
	// c.f. rfc4122 (UUID version 4 = xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
	let oct: string = '';
	let tmp: number;
	/* tslint:disable:no-bitwise */
	for (let a: number = 0; a < 4; a++) {
		tmp = (4294967296 * Math.random()) | 0;
		oct += hexValues[tmp & 0xF] +
			hexValues[tmp >> 4 & 0xF] +
			hexValues[tmp >> 8 & 0xF] +
			hexValues[tmp >> 12 & 0xF] +
			hexValues[tmp >> 16 & 0xF] +
			hexValues[tmp >> 20 & 0xF] +
			hexValues[tmp >> 24 & 0xF] +
			hexValues[tmp >> 28 & 0xF];
	}

	// 'Set the two most significant bits (bits 6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively'
	let clockSequenceHi: string = hexValues[8 + (Math.random() * 4) | 0];
	return oct.substr(0, 8) + '-' + oct.substr(9, 4) + '-4' + oct.substr(13, 3) + '-' + clockSequenceHi + oct.substr(16, 3) + '-' + oct.substr(19, 12);
	/* tslint:enable:no-bitwise */
}

/**
 * Format a string. Behaves like C#'s string.Format() function.
 */
export function formatString(str: string, ...args: any[]): string {
	// This is based on code originally from https://github.com/Microsoft/vscode/blob/master/src/vs/nls.js
	// License: https://github.com/Microsoft/vscode/blob/master/LICENSE.txt
	let result: string;
	if (args.length === 0) {
		result = str;
	} else {
		result = str.replace(/\{(\d+)\}/g, (match, rest) => {
			let index = rest[0];
			return typeof args[index] !== 'undefined' ? args[index] : match;
		});
	}
	return result;
}

/**
 * Compares 2 database names to see if they are the same.
 * If either is undefined or empty, it is assumed to be 'master'
 */
function isSameDatabase(currentDatabase: string, expectedDatabase: string): boolean {
	if (isEmpty(currentDatabase)) {
		currentDatabase = Constants.defaultDatabase;
	}
	if (isEmpty(expectedDatabase)) {
		expectedDatabase = Constants.defaultDatabase;
	}
	return currentDatabase === expectedDatabase;
}

// One-time use timer for performance testing
export class Timer {
	private _startTime: [number, number];
	private _endTime: [number, number];

	constructor() {
		this.start();
	}

	// Get the duration of time elapsed by the timer, in milliseconds
	public getDuration(): number {
		if (!this._startTime) {
			return -1;
		} else if (!this._endTime) {
			let endTime = process.hrtime(this._startTime);
			return endTime[0] * 1000 + endTime[1] / 1000000;
		} else {
			return this._endTime[0] * 1000 + this._endTime[1] / 1000000;
		}
	}

	public start(): void {
		this._startTime = process.hrtime();
	}

	public end(): void {
		if (!this._endTime) {
			this._endTime = process.hrtime(this._startTime);
		}
	}
}

/**
 * Takes a string in the format of HH:MM:SS.MS and returns a number representing the time in
 * miliseconds
 * @param value The string to convert to milliseconds
 * @return False is returned if the string is an invalid format,
 *		 the number of milliseconds in the time string is returned otherwise.
 */
export function parseTimeString(value: string): number | boolean {
	if (!value) {
		return false;
	}
	let tempVal = value.split('.');

	if (tempVal.length !== 2) {
		return false;
	}

	let ms = parseInt(tempVal[1].substring(0, 3), 10);
	tempVal = tempVal[0].split(':');

	if (tempVal.length !== 3) {
		return false;
	}

	let h = parseInt(tempVal[0], 10);
	let m = parseInt(tempVal[1], 10);
	let s = parseInt(tempVal[2], 10);

	return ms + (h * msInH) + (m * msInM) + (s * msInS);
}

/**
 * Takes a number of milliseconds and converts it to a string like HH:MM:SS.fff
 * @param value The number of milliseconds to convert to a timespan string
 * @returns A properly formatted timespan string.
 */
export function parseNumAsTimeString(value: number): string {
	let tempVal = value;
	let h = Math.floor(tempVal / msInH);
	tempVal %= msInH;
	let m = Math.floor(tempVal / msInM);
	tempVal %= msInM;
	let s = Math.floor(tempVal / msInS);
	tempVal %= msInS;

	let hs = h < 10 ? '0' + h : '' + h;
	let ms = m < 10 ? '0' + m : '' + m;
	let ss = s < 10 ? '0' + s : '' + s;
	let mss = tempVal < 10 ? '00' + tempVal : tempVal < 100 ? '0' + tempVal : '' + tempVal;

	let rs = hs + ':' + ms + ':' + ss;

	return tempVal > 0 ? rs + '.' + mss : rs;
}

/**
 * Converts <, >, &, ", ', and any characters that are outside \u00A0 to numeric HTML entity values
 * like &#123;
 * (Adapted from http://stackoverflow.com/a/18750001)
 * @param str String to convert
 * @return String with characters replaced.
 */
export function htmlEntities(str: string): string {
	return typeof (str) === 'string'
		? str.replace(/[\u00A0-\u9999<>\&"']/gim, (i) => { return `&#${i.charCodeAt(0)};`; })
		: undefined;
}

export function isNumber(val: any): boolean {
	return typeof (val) === 'number';
}

export function generateUri(connection: IConnectionProfile, purpose?: 'dashboard' | 'insights' | 'connection'): string {

	let id = connection.getOptionsKey();
	let prefix = purpose ? uriPrefixes[purpose] : uriPrefixes.default;
	let uri = prefix + (id ? id : connection.serverName + ':' + connection.databaseName);

	return uri;
}