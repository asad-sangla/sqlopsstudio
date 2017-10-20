/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IConnectionManagementService, IConnectionCompletionOptions } from 'sql/parts/connection/common/connectionManagement';
import { ITree } from 'vs/base/parts/tree/browser/tree';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';

import { IProgressService, IProgressRunner } from 'vs/platform/progress/common/progress';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import { TreeUpdateUtils } from 'sql/parts/registeredServer/viewlet/treeUpdateUtils';

export class TreeSelectionHandler {
	progressRunner: IProgressRunner;

	private _clicks: number = 0;
	private _doubleClickTimeoutId: number = -1;

	constructor( @IProgressService private _progressService: IProgressService) {

	}

	public onTreeActionStateChange(started: boolean): void {
		if (this.progressRunner) {
			this.progressRunner.done();
		}

		if (started) {
			this.progressRunner = this._progressService.show(true);
		} else {
			this.progressRunner = null;
		}
	}

	private isMouseEvent(event: any): boolean {
		return event && event.payload && event.payload.origin === 'mouse';
	}

	/**
	 * Handle selection of tree element
	 */
	public onTreeSelect(event: any, tree: ITree, connectionManagementService: IConnectionManagementService, objectExplorerService: IObjectExplorerService) {
		if (this.isMouseEvent(event)) {
			this._clicks++;
		}

		// clear pending click timeouts to avoid sending multiple events on double-click
		if (this._doubleClickTimeoutId !== -1) {
			clearTimeout(this._doubleClickTimeoutId);
		}

		let isKeyboard = event && event.payload && event.payload.origin === 'keyboard';

		// grab the current selection for use later
		let selection = tree.getSelection();

		this._doubleClickTimeoutId = setTimeout(() => {
			// don't send tree update events while dragging
			if (!TreeUpdateUtils.isInDragAndDrop) {
				let isDoubleClick = this._clicks > 1;
				this.handleTreeItemSelected(connectionManagementService, objectExplorerService, isDoubleClick, isKeyboard, selection, tree);
			}
			this._clicks = 0;
			this._doubleClickTimeoutId = -1;
		}, 300);
	}

	/**
	 *
	 * @param connectionManagementService
	 * @param objectExplorerService
	 * @param isDoubleClick
	 * @param isKeyboard
	 * @param selection
	 */
	private handleTreeItemSelected(connectionManagementService: IConnectionManagementService, objectExplorerService: IObjectExplorerService, isDoubleClick: boolean, isKeyboard: boolean, selection: any[], tree: ITree): void {
		let connectionProfile: ConnectionProfile = undefined;
		let options: IConnectionCompletionOptions = {
			params: undefined,
			saveTheConnection: false,
			showConnectionDialogOnError: true,
			showFirewallRuleOnError: true,
			showDashboard: isDoubleClick // only show the dashboard if the action is double click
		};
		if (selection && selection.length > 0 && (selection[0] instanceof ConnectionProfile)) {
			connectionProfile = <ConnectionProfile>selection[0];

			if (connectionProfile) {
				this.onTreeActionStateChange(true);

				TreeUpdateUtils.connectAndCreateOeSession(connectionProfile, options, connectionManagementService, objectExplorerService, tree).then(sessionCreated => {
					if (!sessionCreated) {
						this.onTreeActionStateChange(false);
					}
				}, error => {
					this.onTreeActionStateChange(false);
				});
			}
		} else if (isDoubleClick && selection && selection.length > 0 && (selection[0] instanceof TreeNode)) {
			let treeNode = <TreeNode>selection[0];
			if (TreeUpdateUtils.isAvailableDatabaseNode(treeNode)) {
				connectionProfile = TreeUpdateUtils.getConnectionProfile(treeNode);
				if (connectionProfile) {
					connectionManagementService.showDashboard(connectionProfile);
				}
			}
		}

		if (isKeyboard) {
			tree.toggleExpansion(selection[0]);
		}
	}
}