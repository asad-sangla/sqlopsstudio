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

	/**
	 * Handle selection of tree element
	 */
	public onTreeSelect(event: any, tree: ITree, connectionManagementService: IConnectionManagementService, objectExplorerService: IObjectExplorerService) {
		let isDoubleClick: boolean = false;
		let self = this;
		this._clicks++;

		let selection = tree.getSelection();

		setTimeout(function () {
			if (self._clicks === 1) {
				isDoubleClick = false;// using a shared variable so for click and double click would be the same value. If true, the action was double click
			} else {
				isDoubleClick = true;
			}
			let isInDoubleClickBlock = self._clicks > 1;// using a local variable for the block so the value for click and double click would be different. If true then the
			// method is called for double click
			self.handleTreeItemSelected(isDoubleClick, connectionManagementService, objectExplorerService, isInDoubleClickBlock, selection);
			self._clicks = 0;
		}, 300);
	}

	/**
	 *
	 * @param isDoubleClick true if the action was double click, false if it was click
	 * @param connectionManagementService
	 * @param objectExplorerService
	 * @param isInDoubleClickBlock true if the method is called for double click, false if it's called for click
	 * @param selection
	 */
	private handleTreeItemSelected(isDoubleClick: boolean, connectionManagementService: IConnectionManagementService, objectExplorerService: IObjectExplorerService, isInDoubleClickBlock: boolean, selection: any[]): void {
		let connectionProfile: ConnectionProfile = undefined;
		let options: IConnectionCompletionOptions = {
			params: undefined,
			saveTheConnection: false,
			showConnectionDialogOnError: true,
			showDashboard: isDoubleClick // only show the dashboard if the action is double click
		};
		if (selection && selection.length > 0 && (selection[0] instanceof ConnectionProfile)) {
			connectionProfile = <ConnectionProfile>selection[0];

			// check isInDoubleClickBlock to only run this block once otherwise would be called for click and double click
			if (connectionProfile && !isInDoubleClickBlock) {
				this.onTreeActionStateChange(true);

				TreeUpdateUtils.connectAndCreateOeSession(connectionProfile, options, connectionManagementService, objectExplorerService).then(sessionCreated => {
					if (!sessionCreated) {
						this.onTreeActionStateChange(false);
					}
				}, error => {
					this.onTreeActionStateChange(false);
				});
			}
		} else if (selection && selection.length > 0 && (selection[0] instanceof TreeNode)) {
			let treeNode = <TreeNode>selection[0];
			if (TreeUpdateUtils.isDatabaseNode(treeNode)) {
				connectionProfile = TreeUpdateUtils.getConnectionProfile(treeNode);
			}
			// check isInDoubleClickBlock to only run this block once otherwise would be called for click and double click
			if (connectionProfile && !isInDoubleClickBlock) {
				TreeUpdateUtils.connectIfNotConnected(connectionProfile, options, connectionManagementService);
			}
		}
	}
}