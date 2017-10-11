/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as data from 'data';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { FileBrowserTree } from 'sql/parts/fileBrowser/common/fileBrowserTree';
import { FileNode } from 'sql/parts/fileBrowser/common/fileNode';
import { FileBrowserDialog } from 'sql/parts/fileBrowser/fileBrowserDialog';
import { IFileBrowserService } from 'sql/parts/fileBrowser/common/interfaces';
import * as Constants from 'sql/common/constants';
import Event, { Emitter } from 'vs/base/common/event';
import Severity from 'vs/base/common/severity';
import { createDecorator, IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

export class FileBrowserService implements IFileBrowserService {
	public _serviceBrand: any;
	private _providers: { [handle: string]: data.FileBrowserProvider; } = Object.create(null);
	private _onAddFileTree = new Emitter<FileBrowserTree>();
	private _onExpandFolder = new Emitter<FileNode>();
	private _onPathValidate = new Emitter<data.FileBrowserValidatedParams>();
	private _pathToFileNodeMap: { [path: string]: FileNode } = {};
	private _expandResolveMap: { [ownerUri: string]: any }  = {};
	static fileNodeId: number = 0;

	constructor(@IConnectionManagementService private _connectionService: IConnectionManagementService,
		@IInstantiationService private _instantiationService: IInstantiationService) {
	}

	public registerProvider(providerId: string, provider: data.FileBrowserProvider): void {
		this._providers[providerId] = provider;
	}

	public get onAddFileTree(): Event<FileBrowserTree> {
		return this._onAddFileTree.event;
	}

	public get onExpandFolder(): Event<FileNode> {
		return this._onExpandFolder.event;
	}

	public get onPathValidate(): Event<data.FileBrowserValidatedParams> {
		return this._onPathValidate.event;
	}

	public openFileBrowser(ownerUri: string, expandPath: string, fileFilters: string[]): Thenable<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let provider = this.getProvider(ownerUri);
		    if (provider) {
				provider.openFileBrowser(ownerUri, expandPath, fileFilters).then(result => {
					resolve(result);
				}, error => {
					reject(error);
				});
			} else {
				reject(Constants.InvalidProvider);
			}
		});
	}

	public onFileBrowserOpened(handle: number, fileBrowserOpenedParams: data.FileBrowserOpenedParams) {
		if (fileBrowserOpenedParams.succeeded === true
			&& fileBrowserOpenedParams.fileTree
			&& fileBrowserOpenedParams.fileTree.rootNode
			&& fileBrowserOpenedParams.fileTree.selectedNode
		) {
			var fileTree = this.convertFileTree(null, fileBrowserOpenedParams.fileTree.rootNode, fileBrowserOpenedParams.fileTree.selectedNode.fullPath, fileBrowserOpenedParams.ownerUri);
			this._onAddFileTree.fire({rootNode: fileTree.rootNode, selectedNode: fileTree.selectedNode, expandedNodes: fileTree.expandedNodes});
		}
	}

	public expandFolderNode(fileNode: FileNode): Thenable<FileNode[]> {
		this._pathToFileNodeMap[fileNode.fullPath] = fileNode;
		let self = this;
		return new Promise<FileNode[]>((resolve, reject) => {
			let provider = this.getProvider(fileNode.ownerUri);
		    if (provider) {
				provider.expandFolderNode(fileNode.ownerUri, fileNode.fullPath).then(result => {
					self._expandResolveMap[fileNode.ownerUri] = resolve;
				}, error => {
					reject(error);
				});
			} else {
				reject(Constants.InvalidProvider);
			}
		});
	}

	public onFolderNodeExpanded(handle: number, fileBrowserExpandedParams: data.FileBrowserExpandedParams) {
		var expandResolve = this._expandResolveMap[fileBrowserExpandedParams.ownerUri];
		if (expandResolve) {
			if (fileBrowserExpandedParams.succeeded === true && fileBrowserExpandedParams.expandedNode)
			{
				// get the expanded folder node
				var expandedNode = this._pathToFileNodeMap[fileBrowserExpandedParams.expandedNode.fullPath];
				if (expandedNode) {
					if (fileBrowserExpandedParams.expandedNode.children	&& fileBrowserExpandedParams.expandedNode.children.length > 0) {
						expandedNode.children = this.convertChildren(expandedNode, fileBrowserExpandedParams.expandedNode.children, fileBrowserExpandedParams.ownerUri);
					}
					expandResolve(expandedNode.children ? expandedNode.children : []);
					this._onExpandFolder.fire(expandedNode);
				} else {
					expandResolve([]);
				}
			} else {
				expandResolve([]);
			}
		}
	}

	public validateFilePaths(ownerUri: string, serviceType: string, selectedFiles: string[]): Thenable<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let provider = this.getProvider(ownerUri);
		    if (provider) {
				provider.validateFilePaths(ownerUri, serviceType, selectedFiles).then(result => {
					resolve(result);
				}, error => {
					reject(error);
				});
			} else {
				reject(Constants.InvalidProvider);
			}
		});
	}

	public onFilePathsValidated(handle: number, fileBrowserValidatedParams: data.FileBrowserValidatedParams) {
		this._onPathValidate.fire(fileBrowserValidatedParams);
	}

	public closeFileBrowser(ownerUri: string): Thenable<data.FileBrowserCloseResponse> {
		let provider = this.getProvider(ownerUri);
		if (provider) {
			return provider.closeFileBrowser(ownerUri);
		}
		return Promise.resolve(undefined);
	}

	private getProvider(connectionUri: string): data.FileBrowserProvider {
		let providerId: string = this._connectionService.getProviderIdFromUri(connectionUri);
		if (providerId) {
			return this._providers[providerId];
		} else {
			return undefined;
		}
	}

	private convertFileTree(parentNode: FileNode, fileTreeNode: data.FileTreeNode, expandPath: string, ownerUri: string): FileBrowserTree {
		FileBrowserService.fileNodeId += 1;
		var expandedNodes: FileNode[] = [];
		var selectedNode: FileNode;
		var fileNode = new FileNode(FileBrowserService.fileNodeId.toString(),
			fileTreeNode.name,
			fileTreeNode.fullPath,
			fileTreeNode.isFile,
			fileTreeNode.isExpanded,
			ownerUri,
			parentNode
		);

		if (fileNode.isExpanded === true) {
			expandedNodes.push(fileNode);
		}

		if (fileTreeNode.children) {
			var convertedChildren = [];
			for (var i = 0; i < fileTreeNode.children.length; i++) {
				var convertedFileTree: FileBrowserTree = this.convertFileTree(fileNode, fileTreeNode.children[i], expandPath, ownerUri);
				convertedChildren.push(convertedFileTree.rootNode);

				if (convertedFileTree.expandedNodes.length > 0) {
					expandedNodes = expandedNodes.concat(convertedFileTree.expandedNodes);
				}

				if (convertedFileTree.selectedNode) {
					selectedNode = convertedFileTree.selectedNode;
				}
			}

			if (convertedChildren.length > 0) {
				fileNode.children = convertedChildren;
			}
		}

		if (!selectedNode && fileTreeNode.fullPath === expandPath) {
			selectedNode = fileNode;
		}

		// Assume every folder has children initially
		if (fileTreeNode.isFile === false) {
			fileNode.hasChildren = true;
		}

		return { rootNode: fileNode, selectedNode: selectedNode, expandedNodes: expandedNodes };
	}

	private convertChildren(expandedNode: FileNode, childrenToConvert: data.FileTreeNode[], ownerUri: string): FileNode[] {
		var childrenNodes = [];

		for (var i = 0; i < childrenToConvert.length; i++) {
			FileBrowserService.fileNodeId += 1;
			var childNode = new FileNode(FileBrowserService.fileNodeId.toString(),
				childrenToConvert[i].name,
				childrenToConvert[i].fullPath,
				childrenToConvert[i].isFile,
				childrenToConvert[i].isExpanded,
				ownerUri,
				expandedNode
			);

			// Assume every folder has children initially
			if (childrenToConvert[i].isFile === false) {
				childNode.hasChildren = true;
			}
			childrenNodes.push(childNode);
		}

		return childrenNodes;
	}
}
