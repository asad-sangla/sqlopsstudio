/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { ElementRef } from '@angular/core';

declare let AngularCore;
declare let Rx;

@AngularCore.Directive({
  selector: '[onScroll]'
})
export class ScrollDirective {
    @AngularCore.Input() scrollEnabled: boolean = true;
    @AngularCore.Output('onScroll') onScroll = new AngularCore.EventEmitter();

    constructor(@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ElementRef)) private _el: ElementRef) {
        const self = this;
        Rx.Observable.fromEvent(this._el.nativeElement, 'scroll').subscribe((event) => {
            if (self.scrollEnabled) {
                self.onScroll.emit(self._el.nativeElement.scrollTop);
            }
        });
    }
}
