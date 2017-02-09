/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { Dimension, Builder, $ } from 'vs/base/browser/builder';
import DOM = require('vs/base/browser/dom');

export class ConnectionDialogWidget  {
	private builder: Builder;
	//private container: HTMLElement;
	private modelElement: HTMLElement;

	constructor(){
		//this.container = container;
	}

	public create(container: HTMLElement): HTMLElement {
		if(this.builder === undefined) {
		this.builder = $().div({}, (div: Builder) => {

			div.div({class:'modal', id:'myModal', 'role':'dialog'}, (dialogContainer) => {
				dialogContainer.div({class:'modal-dialog', role:'document'}, (modalDialog) => {
					modalDialog.div({class:'modal-content'}, (modelContent) =>{
						modelContent.div({class:'modal-body'}, (modelBody) => {
							modelBody.innerHtml('this is a test');
						});
						modelContent.div({class:'modal-footer'}, (modelFooter) => {
							modelFooter.element('button', {type: 'button', class:'btn btn-default', 'data-dismiss':'modal'}, (closeButton) => {
								closeButton.innerHtml('Close');
							});
						});
					});
				});
			});
			div.element('button', {type:'button', class:'btn btn-primary btn-lg', 'data-toggle':'modal', 'data-target':'#myModal'}, (testButton) => {
				testButton.innerHtml('test');
			});

		})

		.build(container);
		}
		this.modelElement = this.builder.getHTMLElement();
		return this.modelElement;
	}

	public open() {
		require(['jquery', 'bootstrapUi'], function(bootstrap2){
			   bootstrap2('#myModal').modal();
			});
	}
}