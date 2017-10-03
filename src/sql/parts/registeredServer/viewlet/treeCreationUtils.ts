/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./media/serverTreeActions';
import nls = require('vs/nls');
import { Tree } from 'vs/base/parts/tree/browser/treeImpl';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ServerTreeRenderer } from 'sql/parts/registeredServer/viewlet/serverTreeRenderer';
import { ServerTreeDataSource } from 'sql/parts/registeredServer/viewlet/serverTreeDataSource';
import { ServerTreeController } from 'sql/parts/registeredServer/viewlet/serverTreeController';
import { ServerTreeActionProvider } from 'sql/parts/registeredServer/viewlet/serverTreeActionProvider';
import { DefaultFilter, DefaultAccessibilityProvider, DefaultController } from 'vs/base/parts/tree/browser/treeDefaults';
import { IController } from 'vs/base/parts/tree/browser/tree';
import { ServerTreeDragAndDrop, RecentConnectionsDragAndDrop } from 'sql/parts/registeredServer/viewlet/dragAndDropController';
import { RecentConnectionDataSource } from 'sql/parts/registeredServer/viewlet/recentConnectionDataSource';

export class TreeCreationUtils {
	/**
	 * Create a Recent Connections tree
	 */
	public static createConnectionTree(treeContainer: HTMLElement, instantiationService: IInstantiationService, useController?: IController): Tree {
		const dataSource = instantiationService.createInstance(RecentConnectionDataSource);
		const renderer = instantiationService.createInstance(ServerTreeRenderer, true);
		const controller = useController ? useController : new DefaultController();
		const dnd = instantiationService.createInstance(RecentConnectionsDragAndDrop);
		const filter = new DefaultFilter();
		const sorter = undefined;
		const accessibilityProvider = new DefaultAccessibilityProvider();

		return new Tree(treeContainer, { dataSource, renderer, controller, dnd, filter, sorter, accessibilityProvider },
			{
				indentPixels: 10,
				twistiePixels: 20,
				ariaLabel: nls.localize('treeAriaLabel', "Recent Connections")
			});
	}

	/**
	 * Create a Servers viewlet tree
	 */
	public static createRegisteredServersTree(treeContainer: HTMLElement, instantiationService: IInstantiationService): Tree {

		const dataSource = instantiationService.createInstance(ServerTreeDataSource);
		const actionProvider = instantiationService.createInstance(ServerTreeActionProvider);
		const renderer = instantiationService.createInstance(ServerTreeRenderer, false);
		const controller = instantiationService.createInstance(ServerTreeController, actionProvider);
		const dnd = instantiationService.createInstance(ServerTreeDragAndDrop);
		const filter = new DefaultFilter();
		const sorter = undefined;
		const accessibilityProvider = new DefaultAccessibilityProvider();

		return new Tree(treeContainer, { dataSource, renderer, controller, dnd, filter, sorter, accessibilityProvider },
			{
				indentPixels: 10,
				twistiePixels: 20,
				ariaLabel: nls.localize('regTreeAriaLabel', "Servers")
			});
	}
}