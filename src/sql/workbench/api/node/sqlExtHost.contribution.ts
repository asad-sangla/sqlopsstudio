/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'vs/workbench/common/contributions';
import { Registry } from 'vs/platform/platform';
import { IInstantiationService, IConstructorSignature0 } from 'vs/platform/instantiation/common/instantiation';
import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { SqlMainContext, SqlInstanceCollection } from './sqlExtHost.protocol';

// --- SQL contributions
import { MainThreadCredentialManagement } from 'sql/workbench/api/node/mainThreadCredentialManagement';
import { MainThreadDataProtocol } from 'sql/workbench/api/node/mainThreadDataProtocol';


export class SqlExtHostContribution implements IWorkbenchContribution {

	constructor(
		@IThreadService private threadService: IThreadService,
		@IInstantiationService private instantiationService: IInstantiationService
	) {
		this.initExtensionSystem();
	}

	public getId(): string {
		return 'sql.api.sqlExtHost';
	}

	private initExtensionSystem(): void {
		const create = <T>(ctor: IConstructorSignature0<T>): T => {
			return this.instantiationService.createInstance(ctor);
		};

		// Addressable instances
		const col = new SqlInstanceCollection();
		col.define(SqlMainContext.MainThreadCredentialManagement).set(create(MainThreadCredentialManagement));
		col.define(SqlMainContext.MainThreadDataProtocol).set(create(MainThreadDataProtocol));
		col.finish(true, this.threadService);
	}
}

// Register File Tracker
Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(
	SqlExtHostContribution
);
