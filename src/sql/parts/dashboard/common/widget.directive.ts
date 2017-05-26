/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Directive, ViewContainerRef, Inject, forwardRef } from '@angular/core';

@Directive({
	selector: '[widget-host]',
})
export class WidgetDirective {
	constructor(@Inject(forwardRef(() => ViewContainerRef)) public viewContainerRef: ViewContainerRef) {}
}
