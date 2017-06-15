/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Pipe, PipeTransform } from '@angular/core';
import { MetadataType } from 'sql/parts/connection/common/connectionManagement';
import { ObjectMetadataWrapper } from './explorerWidget.component';


@Pipe({
	name: 'metadataFilter',
	pure: false
})
export class ExplorerFilter implements PipeTransform {
	transform(items: ObjectMetadataWrapper[] | string[], filter: string): ObjectMetadataWrapper[] | string[] {
		if (!items) {
			return items;
		}

		if (!filter) {
			return [];
		}


		// format filter string for clean filter, no white space and lower case
		let filterString = filter.trim().toLowerCase();

		// handle case when passed a string array
		if (typeof items[0] === 'string') {
			let _items = <string[]> items;
			return _items.filter(item => {
				return item.toLowerCase().includes(filterString);
			});
		}

		// make typescript compiler happy
		items = <ObjectMetadataWrapper[]> items;

		// determine is a filter is applied
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
				case 'all':
					return items;
				default:
					break;
			}
		}

		return items.filter(item => {
			if (metadataType !== undefined) {
				return item.metadata.metadataType === metadataType && item.metadata.name.toLowerCase().includes(filterString);
			} else {
				return item.metadata.name.toLowerCase().includes(filterString);
			}
		});
	}
}