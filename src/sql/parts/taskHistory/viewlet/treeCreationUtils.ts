/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import nls = require('vs/nls');
import { Tree } from 'vs/base/parts/tree/browser/treeImpl';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ServerTreeRenderer } from 'sql/parts/registeredServer/viewlet/serverTreeRenderer';
import { ServerTreeDataSource } from 'sql/parts/registeredServer/viewlet/serverTreeDataSource';
import { ServerTreeController } from 'sql/parts/registeredServer/viewlet/serverTreeController';
import { ServerTreeActionProvider } from 'sql/parts/registeredServer/viewlet/serverTreeActionProvider';
import { DefaultFilter, DefaultAccessibilityProvider } from 'vs/base/parts/tree/browser/treeDefaults';
import { ServerTreeDragAndDrop } from 'sql/parts/registeredServer/viewlet/dragAndDropController';

export class TreeCreationUtils {
	/**
	 * Create a recent connections tree
	 */
	public static createRegisteredServersTree(treeContainer: HTMLElement, instantiationService: IInstantiationService): Tree {

		const dataSource = instantiationService.createInstance(ServerTreeDataSource);
		const actionProvider = instantiationService.createInstance(ServerTreeActionProvider);
		const renderer = instantiationService.createInstance(ServerTreeRenderer, false);
		const controller = instantiationService.createInstance(ServerTreeController, actionProvider);
		const dnd = instantiationService.createInstance(ServerTreeDragAndDrop);
		const filter = new DefaultFilter();
		const sorter = null;
		const accessibilityProvider = new DefaultAccessibilityProvider();

		return new Tree(treeContainer, {
			dataSource, renderer, controller, dnd, filter, sorter, accessibilityProvider
		}, {
				indentPixels: 10,
				twistiePixels: 20,
				ariaLabel: nls.localize({ key: 'regTreeAriaLabel', comment: ['Servers'] }, 'Servers')
			});

	}
}