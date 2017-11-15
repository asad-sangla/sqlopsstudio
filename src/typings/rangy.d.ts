/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'rangy' {
	export function createRange(): any;
	export function getSelection(): any;

	/**
	 * Simplified interface for a Range object returned by the Rangy javascript plugin
	 *
	 * @export
	 * @interface IRange
	 */
	export interface IRange {
		selectNodeContents(el): void;
		/**
		 * Returns any user-visible text covered under the range, using standard HTML Range API calls
		 *
		 * @returns {string}
		 *
		 * @memberOf IRange
		 */
		toString(): string;
		/**
		 * Replaces the current selection with this range. Equivalent to rangy.getSelection().setSingleRange(range).
		 *
		 *
		 * @memberOf IRange
		 */
		select(): void;

		/**
		 * Returns the `Document` element containing the range
		 *
		 * @returns {Document}
		 *
		 * @memberOf IRange
		 */
		getDocument(): Document;

		/**
		 * Detaches the range so it's no longer tracked by Rangy using DOM manipulation
		 *
		 *
		 * @memberOf IRange
		 */
		detach(): void;

		/**
		 * Gets formatted text under a range. This is an improvement over toString() which contains unnecessary whitespac
		 *
		 * @returns {string}
		 *
		 * @memberOf IRange
		 */
		text(): string;
	}
}
