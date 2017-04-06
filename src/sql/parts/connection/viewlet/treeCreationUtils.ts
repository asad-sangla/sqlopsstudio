/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./media/serverTreeActions';
import nls = require('vs/nls');
import { Tree } from 'vs/base/parts/tree/browser/treeImpl';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ServerTreeRenderer } from 'sql/parts/connection/viewlet/serverTreeRenderer';
import { ServerTreeDataSource } from 'sql/parts/connection/viewlet/serverTreeDataSource';
import { ServerTreeController  } from 'sql/parts/connection/viewlet/serverTreeController';
import { ServerTreeActionProvider } from 'sql/parts/connection/viewlet/serverTreeActionProvider';
import { DefaultFilter, DefaultAccessibilityProvider } from 'vs/base/parts/tree/browser/treeDefaults';
import { ServerTreeDragAndDrop, RecentConnectionsDragAndDrop} from 'sql/parts/connection/viewlet/dragAndDropController';

export class TreeCreationUtils {
	/**
 	* Create a recent connections tree
 	*/
	public static createConnectionTree(treeContainer: HTMLElement, instantiationService: IInstantiationService, isCompact: boolean): Tree {
		const dataSource = instantiationService.createInstance(ServerTreeDataSource);
		const actionProvider = instantiationService.createInstance(ServerTreeActionProvider);
		const renderer = instantiationService.createInstance(ServerTreeRenderer, isCompact);
		const controller = instantiationService.createInstance(ServerTreeController, actionProvider);
		const dnd = instantiationService.createInstance(RecentConnectionsDragAndDrop);
		const filter = new DefaultFilter();
		const sorter = null;
		const accessibilityProvider = new DefaultAccessibilityProvider();

		return new Tree(treeContainer, {
			dataSource, renderer, controller, dnd, filter, sorter, accessibilityProvider
		}, {
				indentPixels: 10,
				twistiePixels: 20,
				ariaLabel: nls.localize({ key: 'treeAriaLabel', comment: ['Recent Connections'] }, 'Recent Connections')
			});

	}

	/**
 	* Create a registered servers tree
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
				ariaLabel: nls.localize({ key: 'regTreeAriaLabel', comment: ['Registered Servers'] }, 'Registered Servers')
			});

	}
}