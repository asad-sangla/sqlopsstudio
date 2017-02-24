'use strict';
import Constants = require('./constants');
import Interfaces = require('./interfaces');
import * as ConnectionContracts from './connection';
import * as Utils from './utils';
import vscode = require('vscode');

/**
 * Sets sensible defaults for key connection properties, especially
 * if connection to Azure
 *
 * @export connectionInfo/fixupConnectionCredentials
 * @param {Interfaces.IConnectionCredentials} connCreds connection to be fixed up
 * @returns {Interfaces.IConnectionCredentials} the updated connection
 */
export function fixupConnectionCredentials(connCreds: vscode.ConnectionInfo): vscode.ConnectionInfo {
    if (!connCreds.serverName) {
        connCreds.serverName = '';
    }

    if (!connCreds.databaseName) {
        connCreds.databaseName = '';
    }

    if (!connCreds.userName) {
        connCreds.userName = '';
    }

    if (!connCreds.password) {
        connCreds.password = '';
    }
    return connCreds;
}
/**
 * Gets a description for a connection to display in the picklist UI
 *
 * @export connectionInfo/getPicklistDescription
 * @param {Interfaces.IConnectionCredentials} connCreds connection
 * @returns {string} description
 */
export function getPicklistDescription(connCreds: Interfaces.IConnectionCredentials): string {
    let desc: string = `[${getConnectionDisplayString(connCreds)}]`;
    return desc;
}

/**
 * Gets detailed information about a connection, which can be displayed in the picklist UI
 *
 * @export connectionInfo/getPicklistDetails
 * @param {Interfaces.IConnectionCredentials} connCreds connection
 * @returns {string} details
 */
export function getPicklistDetails(connCreds: Interfaces.IConnectionCredentials): string {
    // In the current spec this is left empty intentionally. Leaving the method as this may change in the future
    return undefined;
}

/**
 * Gets a display string for a connection. This is a concise version of the connection
 * information that can be shown in a number of different UI locations
 *
 * @export connectionInfo/getConnectionDisplayString
 * @param {Interfaces.IConnectionCredentials} conn connection
 * @returns {string} display string that can be used in status view or other locations
 */
export function getConnectionDisplayString(creds: Interfaces.IConnectionCredentials): string {
    // Update the connection text
    let text: string = creds.server;
    if (creds.database !== '') {
        text = appendIfNotEmpty(text, creds.database);
    } else {
        text = appendIfNotEmpty(text, Constants.defaultDatabaseLabel);
    }
    let user: string = getUserNameOrDomainLogin(creds);
    text = appendIfNotEmpty(text, user);

    // Limit the maximum length of displayed text
    if (text.length > Constants.maxDisplayedStatusTextLength) {
        text = text.substr(0, Constants.maxDisplayedStatusTextLength);
        text += ' \u2026'; // Ellipsis character (...)
    }

    return text;
}

function appendIfNotEmpty(connectionText: string, value: string): string {
    if (Utils.isNotEmpty(value)) {
        connectionText += ` : ${value}`;
    }
    return connectionText;
}

/**
 * Gets a formatted display version of a username, or the domain user if using Integrated authentication
 *
 * @export connectionInfo/getUserNameOrDomainLogin
 * @param {Interfaces.IConnectionCredentials} conn connection
 * @param {string} [defaultValue] optional default value to use if username is empty and this is not an Integrated auth profile
 * @returns {string}
 */
export function getUserNameOrDomainLogin(creds: Interfaces.IConnectionCredentials, defaultValue?: string): string {
    if (!defaultValue) {
        defaultValue = '';
    }

    if (creds.authenticationType === Interfaces.AuthenticationTypes[Interfaces.AuthenticationTypes.Integrated]) {
        return (process.platform === 'win32') ? process.env.USERDOMAIN + '\\' + process.env.USERNAME : '';
    } else {
        return creds.user ? creds.user : defaultValue;
    }
}

/**
 * Gets a detailed tooltip with information about a connection
 *
 * @export connectionInfo/getTooltip
 * @param {Interfaces.IConnectionCredentials} connCreds connection
 * @returns {string} tooltip
 */
export function getTooltip(connCreds: Interfaces.IConnectionCredentials, serverInfo?: ConnectionContracts.ServerInfo): string {
    let tooltip: string =
           'Server name: ' + connCreds.server + '\r\n' +
           'Database name: ' + (connCreds.database ? connCreds.database : '<connection default>') + '\r\n' +
           'Login name: ' + connCreds.user + '\r\n' +
           'Connection encryption: ' + (connCreds.encrypt ? 'Encrypted' : 'Not encrypted') + '\r\n';
    if (serverInfo && serverInfo.serverVersion) {
        tooltip += 'Server version: ' + serverInfo.serverVersion + '\r\n';
    }

    return tooltip;
}
