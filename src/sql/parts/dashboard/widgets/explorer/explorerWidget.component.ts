/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/media/objectTypes/objecttypes';
import 'vs/css!sql/media/icons/common-icons';
import 'vs/css!./media/explorerWidget';

import { Component, Inject, forwardRef, ChangeDetectorRef, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { DashboardWidget, IDashboardWidget, WidgetConfig, WIDGET_CONFIG } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { toDisposableSubscription } from 'sql/parts/common/rxjsUtils';
import { ExplorerFilter, ExplorerRenderer, ExplorerDataSource, ExplorerController, ObjectMetadataWrapper, ExplorerModel } from './explorerTree';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';

import { InputBox, IInputOptions } from 'vs/base/browser/ui/inputbox/inputBox';
import { attachInputBoxStyler, attachListStyler } from 'vs/platform/theme/common/styler';
import * as nls from 'vs/nls';
import { Tree } from 'vs/base/parts/tree/browser/treeImpl';
import { getContentHeight } from 'vs/base/browser/dom';
import { Delayer } from 'vs/base/common/async';

@Component({
	selector: 'explorer-widget',
	templateUrl: decodeURI(require.toUrl('sql/parts/dashboard/widgets/explorer/explorerWidget.component.html'))
})
export class ExplorerWidget extends DashboardWidget implements IDashboardWidget, OnInit {
	private _input: InputBox;
	private _tree: Tree;
	private _filterDelayer = new Delayer<void>(200);
	private _treeController = new ExplorerController(
		this._bootstrap.getUnderlyingUri(),
		this._bootstrap.connectionManagementService,
		this._router,
		this._bootstrap.contextMenuService,
		this._bootstrap.capabilitiesService,
		this._bootstrap.instantiationService
	);
	private _treeRenderer = new ExplorerRenderer();
	private _treeDataSource = new ExplorerDataSource();
	private _treeFilter = new ExplorerFilter();

	@ViewChild('input') private _inputContainer: ElementRef;
	@ViewChild('table') private _tableContainer: ElementRef;

	constructor(
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface,
		@Inject(forwardRef(() => Router)) private _router: Router,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef,
		@Inject(WIDGET_CONFIG) protected _config: WidgetConfig,
		@Inject(forwardRef(() => ElementRef)) private _el: ElementRef
	) {
		super();
		this.init();
	}

	ngOnInit() {
		let inputOptions: IInputOptions = {
			placeholder: this._config.context === 'database' ? nls.localize('seachObjects', 'Search by name of type (a:, t:, v:, f:, or sp:)') : nls.localize('searchDatabases', 'Search databases')
		};
		this._input = new InputBox(this._inputContainer.nativeElement, this._bootstrap.contextViewService, inputOptions);
		this._register(this._input.onDidChange(e => {
			this._filterDelayer.trigger(() => {
				this._treeFilter.filterString = e;
				this._tree.refresh();
			});
		}));
		this._tree = new Tree(this._tableContainer.nativeElement, {
			controller: this._treeController,
			dataSource: this._treeDataSource,
			filter: this._treeFilter,
			renderer: this._treeRenderer
		});
		this._tree.layout(getContentHeight(this._tableContainer.nativeElement));
		this._register(this._input);
		this._register(attachInputBoxStyler(this._input, this._bootstrap.themeService));
		this._register(this._tree);
		this._register(attachListStyler(this._tree, this._bootstrap.themeService));
	}

	private init(): void {
		if (this._config.context === 'database') {
			this._register(toDisposableSubscription(this._bootstrap.metadataService.metadata.subscribe(
				data => {
					if (data) {
						let objectData = ObjectMetadataWrapper.createFromObjectMetadata(data.objectMetadata);
						objectData.sort(ObjectMetadataWrapper.sort);
						this._treeDataSource.data = objectData;
						this._tree.setInput(new ExplorerModel());
					}
				},
				error => {
					(<HTMLElement>this._el.nativeElement).innerText = nls.localize('dashboard.explorer.objectError', "Unable to load objects");
				}
			)));
		} else {
			let currentProfile = this._bootstrap.connectionManagementService.connectionInfo.connectionProfile;
			this._register(toDisposableSubscription(this._bootstrap.metadataService.databaseNames.subscribe(
				data => {
					let profileData = data.map(d => {
						let profile = new ConnectionProfile(currentProfile.serverCapabilities, currentProfile);
						profile.databaseName = d;
						return profile;
					});
					this._treeDataSource.data = profileData;
					this._tree.setInput(new ExplorerModel());
				},
				error => {
					(<HTMLElement>this._el.nativeElement).innerText = nls.localize('dashboard.explorer.databaseError', "Unable to load databases");
				}
			)));
		}
	}

	public refresh(): void {
		this.init();
	}
}
