/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import Event from 'vs/base/common/event';

/**
 * Represents a interface that handles interop between the database list component
 * and referencing / containing components. This is required since many of the containers
 * will not be Angular based, and hence some of the patterns used there do not work.
 */
export interface IDbListInterop {
	lookupUri(id: string): string;
    /**
     * Send a callback that the database has changed, so some action can occur
     * in the parent component
     */
	databaseSelected(dbName: string): void;

    /**
     * Event from parent compoent to the database list component, indicating
     * that the active database for this URI has been changed
     */
	onDatabaseChanged: Event<string>;

    /**
     * Send a callback that the database list component has initialized, so some action can occur
     * in the parent component
     */
	databaseListInitialized(): void;

    /**
     * Send a callback that the database selected when the control lost focus
     */
	databasesSelectedOnLostFocus(dbName: string): void;
}