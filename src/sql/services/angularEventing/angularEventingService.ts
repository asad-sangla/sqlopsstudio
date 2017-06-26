/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';

const ANGULAREVENTING_SERVICE_ID = 'angularEventingService';
export const IAngularEventingService = createDecorator<IAngularEventingService>(ANGULAREVENTING_SERVICE_ID);

export interface IAngularEventingService {
	_serviceBrand: any;
	/**
	 * Adds a listener for the dashboard to send events, should only be called once for each dashboard by the dashboard itself
	 * @param uri Uri of the dashboard
	 * @param cb Listening function
	 * @returns
	 */
	onAngularEvent(uri: string, cb: (event: string) => void): Subscription;

	/**
	 * Send an event to the dashboard; no op if the dashboard has not started listening yet
	 * @param uri Uri of the dashboard to send the event to
	 * @param event event to send
	 */
	sendAngularEvent(uri: string, event: string): void;
}

export class AngularEventingService implements IAngularEventingService {
	public _serviceBrand: any;
	private _angularMap = new Map<string, Subject<string>>();

	public onAngularEvent(uri: string, cb: (event: string) => void): Subscription {
		let subject: Subject<string>;
		if (!this._angularMap.has(uri)) {
			subject = new Subject<string>();
			this._angularMap.set(uri, subject);
		} else {
			subject = this._angularMap.get(uri);
		}
		let sub = subject.subscribe(cb);
		return sub;
	}

	public sendAngularEvent(uri: string, event: string): void {
		if (!this._angularMap.has(uri)) {
			console.error('Got request to send an event to a dashboard that has not started listening');
		} else {
			this._angularMap.get(uri).next(event);
		}
	}
}
