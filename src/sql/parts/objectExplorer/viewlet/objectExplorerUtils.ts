/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import nls = require('vs/nls');
import { ITree } from 'vs/base/parts/tree/browser/tree';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { ConnectionFactory } from 'sql/parts/connection/common/connectionFactory';
import { Tree } from 'vs/base/parts/tree/browser/treeImpl';
import { DefaultFilter, DefaultAccessibilityProvider } from 'vs/base/parts/tree/browser/treeDefaults';
import { ObjectExplorerRenderer } from 'sql/parts/objectExplorer/viewlet/objectExplorerRenderer';
import { ObjectExplorerDataSource } from 'sql/parts/objectExplorer/viewlet/objectExplorerDataSource';
import { ObjectExplorerDragAndDrop } from 'sql/parts/objectExplorer/viewlet/objectExplorerDragAndDrop';
import { IConnectionManagementService, IConnectionCompletionOptions } from 'sql/parts/connection/common/connectionManagement';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { ObjectExplorerActionProvider } from 'sql/parts/objectExplorer/viewlet/objectExplorerActionProvider';
import { ObjectExplorerController } from 'sql/parts/objectExplorer/viewlet/objectExplorerController';
import * as Utils from 'sql/parts/connection/common/utils';

export class ObjectExplorerUtils {
	/**
	 * Create a object explorer tree
	 */
	public static createObjectExplorerTree(treeContainer: HTMLElement, instantiationService: IInstantiationService, isCompact: boolean): Tree {
		const dataSource = instantiationService.createInstance(ObjectExplorerDataSource);
		const actionProvider = instantiationService.createInstance(ObjectExplorerActionProvider);
		const renderer = instantiationService.createInstance(ObjectExplorerRenderer, isCompact);
		const controller = instantiationService.createInstance(ObjectExplorerController, actionProvider);
		const dnd = instantiationService.createInstance(ObjectExplorerDragAndDrop);
		const filter = new DefaultFilter();
		const sorter = null;
		const accessibilityProvider = new DefaultAccessibilityProvider();

		return new Tree(treeContainer, {
			dataSource, renderer, controller, dnd, filter, sorter, accessibilityProvider
		}, {
				indentPixels: 10,
				twistiePixels: 20,
				ariaLabel: nls.localize({ key: 'treeAriaLabel', comment: ['Object Explorer'] }, 'Object Explorer')
			});

	}

	/**
	 * Handle selection of tree element
	 */
	public static onTreeSelect(event: any, tree: ITree, connectionManagementService: IConnectionManagementService) {
		let selection = tree.getSelection();

		if (selection && selection.length > 0 && (selection[0] instanceof ConnectionProfile)) {
			let connectionProfile = <ConnectionProfile>selection[0];
			let isMouseOrigin = event.payload && (event.payload.origin === 'mouse');
			let isDoubleClick = isMouseOrigin && event.payload.originalEvent && event.payload.originalEvent.detail === 2;
			if (isDoubleClick) {
				if (!connectionManagementService.isProfileConnected(connectionProfile)) {
					let options: IConnectionCompletionOptions = {
						params: undefined,
						saveToSettings: false,
						showDashboard: true,
						showConnectionDialogOnError: false
					};
					connectionManagementService.connect(connectionProfile, undefined, options);
				}
				else {
					let uri = ConnectionFactory.DefaultUriPrefix + connectionProfile.getOptionsKey();
					var connectionInfo = new ConnectionManagementInfo();
					connectionInfo.extensionTimer = new Utils.Timer();
					connectionInfo.intelliSenseTimer = new Utils.Timer();
					connectionInfo.connecting = true;
					connectionInfo.serviceTimer = new Utils.Timer();
					connectionInfo.connectionProfile = connectionProfile;
					if (connectionManagementService.getConnectionInfo(uri)) {
						connectionInfo.serverInfo = connectionManagementService.getConnectionInfo(uri).serverInfo;
					}
					connectionManagementService.showDashboard(uri, connectionInfo);
				}
			}
		}
	}

	/**
	 * Convert interface to match connection management API
	 */
	public static convertToConnectionProfile(conns: ConnectionProfile[]): ConnectionProfile[] {
		let connections = [];

		conns.forEach((conn) => {
			connections.push(conn);
		});
		return connections;
	}
}