/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { Disposable } from 'vs/base/common/lifecycle';
import { Dimension } from 'vs/base/browser/builder';
import Event, { Emitter } from 'vs/base/common/event';
import { IHorizontalSashLayoutProvider,	ISashEvent, Orientation, VSash, Sash } from 'vs/base/browser/ui/sash/sash';
// There is no need to import the sash CSS - 'vs/base/browser/ui/sash/sash' already includes it

/**
 * Interface describing a sash that could be horizontal or vertical. This interface allows classes
 * using the sash to have UI logic that is agnostic of the orientation of the sash.
 */
export interface IFlexibleSash {

	// Get the value of the CSS property denoted by getMajorPosition()
	getMajorPositionValue(): number;

	// Get the CSS property that describes how to layout this sash
	getMajorPositionName(): string;

	// Get the CSS property that describes the dynamic size of this sash
	getMajorDimensionName(): string;

	// Get the CSS property that describes the static size of this sash
	getMinorDimensionName(): string;

	// Sets the Dimension containing the height and width of the editor this sash will separate
	setDimenesion(dimension: Dimension);

	// Creates a Dimension object with the given majorDimension and minorDimension of this sash.
	createDimension(majorDimension: number, minorDimension: number): Dimension;

	// Fired when the position of this sash changes
	onPositionChange: Event<number>;
}

/**
 * A simple Vertical Sash that computes the position of the sash when it is moved between the given dimension.
 * Triggers onPositionChange event when the position is changed. Implements IFlexibleSash to enable classes to be
 * agnostic of the fact that this sash is vertical.
 */
export class VerticalFlexibleSash extends VSash implements IFlexibleSash {

	private majorPosition: string = 'left';
	private majorDimension: string = 'width';
	private minorDimension: string = 'height';

	constructor(container: HTMLElement, minWidth: number) {
		super(container, minWidth);
	}

	public getMajorPositionValue(): number {
		return this.getVerticalSashLeft();
	}

	public getMajorPositionName(): string {
		return this.majorPosition;
	}

	public getMajorDimensionName(): string {
		return this.majorDimension;
	}

	public getMinorDimensionName(): string {
		return this.minorDimension;
	}

	public createDimension(majorDimension: number, minorDimension: number): Dimension {
		return new Dimension(majorDimension, minorDimension);
	}
}

/**
 * A simple Horizontal Sash that computes the position of the sash when it is moved between the given dimension.
 * Triggers onPositionChange event when the position is changed. Implements IFlexibleSash to enable classes to be
 * agnostic of the fact that this sash is horizontal. Based off the VSash class.
 */
export class HorizontalFlexibleSash extends Disposable implements IHorizontalSashLayoutProvider, IFlexibleSash {

	private sash: Sash;
	private ratio: number;
	private startPosition: number;
	private position: number;
	private dimension: Dimension;

	private majorPosition: string = 'top';
	private majorDimension: string = 'height';
	private minorDimension: string = 'width';

	private _onPositionChange: Emitter<number> = new Emitter<number>();
	public get onPositionChange(): Event<number> { return this._onPositionChange.event; }

	constructor(container: HTMLElement, private minHeight: number) {
		super();
		this.ratio = 0.5;
		this.sash = new Sash(container, this, { orientation: Orientation.HORIZONTAL });

		this._register(this.sash.addListener2('start', () => this.onSashDragStart()));
		this._register(this.sash.addListener2('change', (e: ISashEvent) => this.onSashDrag(e)));
		this._register(this.sash.addListener2('end', () => this.onSashDragEnd()));
		this._register(this.sash.addListener2('reset', () => this.onSashReset()));
	}

	public getMajorPositionValue(): number {
		return this.getHorizontalSashTop();
	}

	public getMajorPositionName(): string {
		return this.majorPosition;
	}

	public getMajorDimensionName(): string {
		return this.majorDimension;
	}

	public getMinorDimensionName(): string {
		return this.minorDimension;
	}

	public createDimension(majorDimension: number, minorDimension: number): Dimension {
		return new Dimension(minorDimension, majorDimension);
	}

	public getHorizontalSashLeft?(): number {
		return 0;
	}

	public getHorizontalSashTop(): number {
		return this.position;
	}

	public getHorizontalSashWidth?(): number {
		return this.dimension.width;
	}

	public setDimenesion(dimension: Dimension) {
		this.dimension = dimension;
		this.compute(this.ratio);
	}

	private onSashDragStart(): void {
		this.startPosition = this.position;
	}

	private onSashDrag(e: ISashEvent): void {
		this.compute((this.startPosition + (e.currentY - e.startY)) / this.dimension.height);
	}

	private compute(ratio: number) {
		this.computeSashPosition(ratio);
		this.ratio = this.position / this.dimension.height;
		this._onPositionChange.fire(this.position);
	}

	private onSashDragEnd(): void {
		this.sash.layout();
	}

	private onSashReset(): void {
		this.ratio = 0.5;
		this._onPositionChange.fire(this.position);
		this.sash.layout();
	}

	/**
	 * Computes where the sash should be located and re-renders the sash.
	 */
	private computeSashPosition(sashRatio: number = this.ratio) {
		let contentHeight = this.dimension.height;
		let sashPosition = Math.floor((sashRatio || 0.5) * contentHeight);
		let midPoint = Math.floor(0.5 * contentHeight);

		if (contentHeight > this.minHeight * 2) {
			if (sashPosition < this.minHeight) {
				sashPosition = this.minHeight;
			}
			if (sashPosition > contentHeight - this.minHeight) {
				sashPosition = contentHeight - this.minHeight;
			}
		} else {
			sashPosition = midPoint;
		}
		if (this.position !== sashPosition) {
			this.position = sashPosition;
			this.sash.layout();
		}
	}
}