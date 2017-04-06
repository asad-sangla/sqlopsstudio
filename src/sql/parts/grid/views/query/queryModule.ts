/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { QueryComponent } from 'sql/parts/grid/views/query/queryComponent';
import { SlickGrid } from 'angular2-slickgrid';
import { MouseDownDirective } from 'sql/parts/grid/directives/mousedown.directive';
import { ScrollDirective } from 'sql/parts/grid/directives/scroll.directive';

declare let AngularPlatformBrowser;
declare let AngularCore;

@AngularCore.NgModule({
	imports: [AngularPlatformBrowser.BrowserModule],
	declarations: [QueryComponent, SlickGrid, ScrollDirective, MouseDownDirective],
	bootstrap: [QueryComponent]
})
export class QueryModule { }
