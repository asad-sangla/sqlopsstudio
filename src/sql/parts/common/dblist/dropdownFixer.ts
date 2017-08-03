/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Dropdown } from 'primeng/primeng';

export default function fixDropdownPrototype() {
	// Workaround for broken change detection: ensure detectChanges is called
	// on hide and on unbind of the document listener
	let dropdownPrototype: any = Dropdown.prototype;
	if (!dropdownPrototype.originalHide) {
		dropdownPrototype.originalHide = dropdownPrototype.hide;
		dropdownPrototype.hide = function() {
			this.originalHide();
			this.resetFilter();
			this.cd.detectChanges();
		};

		dropdownPrototype.originalOnFilter = dropdownPrototype.onFilter;
		dropdownPrototype.onFilter = function(event) {
			this.originalOnFilter(event);
			this.cd.detectChanges();
		};

		dropdownPrototype.originalUnbindDocumentClickListener = dropdownPrototype.unbindDocumentClickListener;
		dropdownPrototype.unbindDocumentClickListener = function () {
			this.originalUnbindDocumentClickListener();
			this.cd.detectChanges();
		};
	}
}