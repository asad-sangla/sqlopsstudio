/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// constants
export const languageId = 'sql';
export const extensionName = 'mssql';
export const extensionConfigSectionName = 'mssql';
export const connectionApplicationName = 'vscode-mssql';
export const outputChannelName = 'MSSQL';

export const connectionConfigFilename = 'settings.json';
export const connectionsArrayName = 'datasource.connections';
export const connectionGroupsArrayName = 'datasource.connectionGroups';

export const sqlDbPrefix = '.database.windows.net';
export const defaultConnectionTimeout = 15;
export const azureSqlDbConnectionTimeout = 30;
export const azureDatabase = 'Azure';
export const defaultPortNumber = 1433;
export const sqlAuthentication = 'SqlLogin';
export const defaultDatabase = 'master';

export const errorPasswordExpired = 18487;
export const errorPasswordNeedsReset = 18488;

export const maxDisplayedStatusTextLength = 50;

export const outputContentTypeRoot = 'root';
export const outputContentTypeMessages = 'messages';
export const outputContentTypeResultsetMeta = 'resultsetsMeta';
export const outputContentTypeColumns = 'columns';
export const outputContentTypeRows = 'rows';
export const outputContentTypeConfig = 'config';
export const outputContentTypeSaveResults = 'saveResults';
export const outputContentTypeOpenLink = 'openLink';
export const outputContentTypeCopy = 'copyResults';
export const outputContentTypeEditorSelection = 'setEditorSelection';
export const outputContentTypeShowError = 'showError';
export const outputContentTypeShowWarning = 'showWarning';
export const outputServiceLocalhost = 'http://localhost:';
export const msgContentProviderSqlOutputHtml = 'dist/html/sqlOutput.ejs';
export const contentProviderMinFile = 'dist/js/app.min.js';

export const onDidConnectMessage = 'Connected to';
export const onDidDisconnectMessage = 'Disconnected';

/**Unsaved connections Id */
export const unsavedGroupId = 'unsaved';
export const unsavedGroupLabel = 'Unsaved Connections';

/* Memento constants */
export const activeConnections = 'ACTIVE_CONNECTIONS';
export const recentConnections = 'RECENT_CONNECTIONS';
export const capabilitiesOptions = 'OPTIONS_METADATA';

export const configRecentConnections = 'recentConnections';
export const configMaxRecentConnections = 'maxRecentConnections';

export const msgIsRequired = ' is required.';
export const msgYes = 'Yes';
export const msgNo = 'No';
