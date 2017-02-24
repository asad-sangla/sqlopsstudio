/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';

import * as Constants from 'sql/parts/connection/node/constants';
import vscode = require('vscode');

// CONSTANTS //////////////////////////////////////////////////////////////////////////////////////
const msInH = 3.6e6;
const msInM = 60000;
const msInS = 1000;


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

/**
 * Compares 2 authentication type strings to see if they are the same.
 * If either is undefined or empty, then it is assumed to be SQL authentication by default.
 */
function isSameAuthenticationType(currentAuthenticationType: string, expectedAuthenticationType: string): boolean {
    if (isEmpty(currentAuthenticationType)) {
        currentAuthenticationType = Constants.sqlAuthentication;
    }
    if (isEmpty(expectedAuthenticationType)) {
        expectedAuthenticationType = Constants.sqlAuthentication;
    }
    return currentAuthenticationType === expectedAuthenticationType;
}

/**
 * Compares 2 profiles to see if they match. Logic for matching:
 * If a profile name is used, can simply match on this.
 * If not, match on all key properties (server, db, auth type, user) being identical.
 * Other properties are ignored for this purpose
 *
 * @param {vscode.ConnectionInfo} currentProfile the profile to check
 * @param {vscode.ConnectionInfo} expectedProfile the profile to try to match
 * @returns boolean that is true if the profiles match
 */
export function isSameProfile(currentProfile: vscode.ConnectionInfo, expectedProfile: vscode.ConnectionInfo): boolean {
    if (currentProfile === undefined) {
        return false;
    }

    return expectedProfile.serverName === currentProfile.serverName
        && isSameDatabase(expectedProfile.databaseName, currentProfile.databaseName)
        && isSameAuthenticationType(expectedProfile.authenticationType, currentProfile.authenticationType)
        && expectedProfile.userName === currentProfile.userName;
}

// One-time use timer for performance testing
export class Timer {
    private _startTime: number[];
    private _endTime: number[];

    constructor() {
        this.start();
    }

    // Get the duration of time elapsed by the timer, in milliseconds
    public getDuration(): number {
		return 0;
        // if (!this._startTime) {
        //     return -1;
        // } else if (!this._endTime) {
        //     let endTime = process.hrtime(this._startTime);
        //     return  endTime[0] * 1000 + endTime[1] / 1000000;
        // } else {
        //     return this._endTime[0] * 1000 + this._endTime[1] / 1000000;
        // }
    }

    public start(): void {
        this._startTime = process.hrtime();
    }

    public end(): void {
        // if (!this._endTime) {
        //     this._endTime = process.hrtime(this._startTime);
        // }
    }
}

/**
 * Takes a string in the format of HH:MM:SS.MS and returns a number representing the time in
 * miliseconds
 * @param value The string to convert to milliseconds
 * @return False is returned if the string is an invalid format,
 *         the number of milliseconds in the time string is returned otherwise.
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
    return typeof(str) === 'string'
        ? str.replace(/[\u00A0-\u9999<>\&"']/gim, (i) => { return `&#${i.charCodeAt(0)};`; })
        : undefined;
}

export function isNumber(val: any): boolean {
    return typeof(val) === 'number';
}