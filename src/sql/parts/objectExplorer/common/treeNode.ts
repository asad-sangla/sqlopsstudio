/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

'use strict';

import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { NodeType } from 'sql/parts/objectExplorer/common/nodeType';

export class TreeNode {

    /**
     * string defining the type of the node - for example Server, Database, Folder, Table
     */
    public nodeTypeId: string;

    /**
     * Label to display to the user, describing this node
     */
    public label: string;

    /**
     * Is this a leaf node (in which case no children can be generated) or is it expandable?
     */
    public isAlwaysLeaf: boolean;

    /**
     * Message to show if this Node is in an error state. This indicates
     * that children could be retrieved
     */
    public errorStateMessage: string;

    /**
     * Parent of this node
     */
    public parent: TreeNode;

    /**
     * Path identifying this node
     */
    public nodePath: string;

    /**
     * Children of this node
     */
    public children: TreeNode[];


    public connection: ConnectionProfile;

    public getConnectionProfile(): ConnectionProfile {
        var currentNode:TreeNode = this;
        while (!currentNode.connection && currentNode.parent) {
            currentNode = currentNode.parent;
        }
        return currentNode.connection;
    }

    public getDatabaseName(): string {
        if (this.connection) {
            return undefined;
        }
        var currentNode:TreeNode = this;
        while (currentNode.nodeTypeId !== NodeType.Database && currentNode.nodeTypeId !== NodeType.Server) {
            currentNode = currentNode.parent;
        }

        if (currentNode.nodeTypeId === NodeType.Database) {
            return currentNode.label;
        }
        return undefined;
    }

    public isTopLevel(): boolean {
        if (this.parent && this.parent.nodeTypeId === NodeType.Root) {
            return true;
        }
        return false;
    }

    constructor(id: string, label: string, isAlwaysLeaf:boolean, nodePath: string, parent: TreeNode){
        this.nodeTypeId = id;
        this.label = label;
        this.isAlwaysLeaf = isAlwaysLeaf;
        this.nodePath = nodePath;
        this.parent = parent;
    }
}