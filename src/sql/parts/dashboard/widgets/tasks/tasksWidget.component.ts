/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import 'vs/css!sql/media/icons/common-icons';

/* Node Modules */
import { Component, Inject, forwardRef, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/* SQL imports */
import { DashboardWidget, IDashboardWidget, WidgetConfig, WIDGET_CONFIG } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { ITaskRegistry, Extensions, ActionICtor } from 'sql/platform/tasks/taskRegistry';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';

/* VS imports */
import { IDisposable } from 'vs/base/common/lifecycle';
import * as themeColors from 'vs/workbench/common/theme';
import * as colors from 'vs/platform/theme/common/colorRegistry';
import { registerThemingParticipant, ICssStyleCollector, ITheme } from 'vs/platform/theme/common/themeService';
import { Registry } from 'vs/platform/registry/common/platform';
import { Action } from 'vs/base/common/actions';
import Severity from 'vs/base/common/severity';
import * as nls from 'vs/nls';

interface IConfig {
	tasks: Array<Object>;
}

@Component({
	selector: 'tasks-widget',
	templateUrl: require.toUrl('sql/parts/dashboard/widgets/tasks/tasksWidget.component.html')
})
export class TasksWidget extends DashboardWidget implements IDashboardWidget, OnInit, OnDestroy {
	private _size: number = 100;
	private _margins: number = 10;
	private _rows: number = 2;
	private _isAzure = false;
	private _themeDispose: IDisposable;
	private _actions: Array<Action> = [];
	private _profile: IConnectionProfile;

	constructor(
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface,
		@Inject(forwardRef(() => DomSanitizer)) private _sanitizer: DomSanitizer,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeref: ChangeDetectorRef,
		@Inject(WIDGET_CONFIG) protected _config: WidgetConfig
	) {
		super();
		this._profile = this._bootstrap.connectionManagementService.connectionInfo.connectionProfile;
		let registry = Registry.as<ITaskRegistry>(Extensions.TaskContribution);
		let tasksConfig = <IConfig>Object.values(this._config.widget)[0];
		if (tasksConfig.tasks) {
			Object.keys(tasksConfig.tasks).forEach((item) => {
				if (registry.idToCtorMap[item]) {
					let ctor = registry.idToCtorMap[item];
					this._actions.push(this._bootstrap.instantiationService.createInstance(ctor, ctor.ID, ctor.LABEL, ctor.ICON));
				} else {
					this._bootstrap.messageService.show(Severity.Warning, nls.localize('missingTask', 'Could not find task {0}; are you missing an extension?', item));
				}
			});
		} else {
			this._actions = Object.values(registry.idToCtorMap).map((item: ActionICtor) => this._bootstrap.instantiationService.createInstance(item, item.ID, item.LABEL, item.ICON));
		}
		let connInfo = this._bootstrap.connectionManagementService.connectionInfo;
		this._isAzure = connInfo.serverInfo.isCloud;
	}

	ngOnInit() {
		this._themeDispose = registerThemingParticipant(this.registerThemeing);
	}

	private registerThemeing(theme: ITheme, collector: ICssStyleCollector) {
		let contrastBorder = theme.getColor(colors.contrastBorder);
		let sideBarColor = theme.getColor(themeColors.SIDE_BAR_BACKGROUND);
		if (contrastBorder) {
			let contrastBorderString = contrastBorder.toString();
			collector.addRule(`.task-widget .task-tile { border: 1px solid ${contrastBorderString} }`);
		} else {
			let sideBarColorString = sideBarColor.toString();
			collector.addRule(`.task-widget .task-tile { background-color: ${sideBarColorString} }`);
		}
	}

	ngOnDestroy() {
		this._themeDispose.dispose();
	}

	//tslint:disable-next-line
	private calculateTransform(index: number): string {
		let marginy = (1 + (index % this._rows)) * this._margins;
		let marginx = (1 + (Math.floor(index / 2))) * this._margins;
		let posx = (this._size * (Math.floor(index / 2))) + marginx;
		let posy = (this._size * (index % this._rows)) + marginy;
		return 'translate(' + posx + 'px, ' + posy + 'px)';
	}
}
