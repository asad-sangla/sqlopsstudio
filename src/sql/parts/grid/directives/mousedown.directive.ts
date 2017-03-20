/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { ElementRef } from '@angular/core';

declare let AngularCore;

@AngularCore.Directive({
  selector: '[mousedown]'
})
export class MouseDownDirective {
    @AngularCore.Output('mousedown') onMouseDown = new AngularCore.EventEmitter();

    constructor(@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ElementRef)) private _el: ElementRef) {
        const self = this;
        setTimeout(() => {
            let $gridCanvas = $(this._el.nativeElement).find('.grid-canvas');
            $gridCanvas.on('mousedown', () => {
                self.onMouseDown.emit();
            });
            let jQueryCast: any = $;
            let mouseDownFuncs: any[] = jQueryCast._data($gridCanvas[0], 'events')['mousedown'];
            // reverse the event array so that our event fires first.
            mouseDownFuncs.reverse();
        });
    }
}
