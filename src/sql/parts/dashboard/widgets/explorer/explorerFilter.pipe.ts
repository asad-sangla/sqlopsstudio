/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Pipe, PipeTransform } from '@angular/core';
import { MetadataType } from 'sql/parts/connection/common/connectionManagement';
import { ObjectMetadataWrapper } from './explorerWidget.component';


@Pipe({
	name: 'metadataFilter'
})
export class MetadataFilterPipe implements PipeTransform {
	transform(items: ObjectMetadataWrapper[] | string[], filter: string): ObjectMetadataWrapper[] | string[] {
		if (!items || !filter) {
			return items;
		}

		// handle case when passed a string array
		if (typeof items[0] === 'string') {
			let _items = <string[]> items;
			return _items.filter(item => {
				return item.includes(filter);
			});
		}

		// make typescript compiler happy
		items = <ObjectMetadataWrapper[]> items;

		// save a local version of the string for comparison
		let filterString = filter;

		// determine is a filter applied
		let metadataType: MetadataType;

		if (filter.indexOf(':') > 0) {
			let filterArray = filterString.split(':');

			if (filterArray.length > 2) {
				filterString = filterArray.slice(1, filterArray.length - 1).join(':');
			} else {
				filterString = filterArray[1];
			}

			switch(filterArray[0].toLowerCase()) {
				case 'view':
					metadataType = MetadataType.View;
					break;
				case 'table':
					metadataType = MetadataType.Table;
					break;
				case 'proc':
					metadataType = MetadataType.SProc;
					break;
				case 'func':
				case 'function':
					metadataType = MetadataType.Function;
					break;
				default:
					break;
			}
		}

		filterString = filterString.trim();

		return items.filter(item => {
			if (metadataType !== undefined) {
				return item.metadata.metadataType === metadataType && item.metadata.name.includes(filterString);
			} else {
				return item.metadata.name.includes(filterString);
			}
		});
	}
}