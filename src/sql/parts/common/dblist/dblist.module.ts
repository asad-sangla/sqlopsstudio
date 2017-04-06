/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DbListComponent } from 'sql/parts/common/dblist/dblist.component';

declare let AngularPlatformBrowser;
declare let AngularCore;
declare let AngularForms;
declare let PrimeNg;
@AngularCore.NgModule({
	imports: [
		AngularPlatformBrowser.BrowserModule,
		AngularForms.FormsModule,
		PrimeNg.DropdownModule],
	declarations: [DbListComponent],
	bootstrap: [DbListComponent]
})
export class DbListModule {
}

export const DBListAngularSelectorString = 'database-list';

let id: number = 0;

/*
 * TODO This function should be refactored per issue #460 to use common logic for getting unique IDs
 * for each component
 */
export function GetUniqueDbListUri(): string {
	return 'DbList://' + id++;
}


