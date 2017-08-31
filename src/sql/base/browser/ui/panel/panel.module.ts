/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TabComponent } from './tab.component';
import { PanelComponent } from './panel.component';

@NgModule({
	imports: [CommonModule],
	exports: [TabComponent, PanelComponent],
	declarations: [TabComponent, PanelComponent]
})
export class PanelModule { }