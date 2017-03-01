import { Action, IActionItem, IActionRunner } from 'vs/base/common/actions';
import { TPromise } from 'vs/base/common/winjs.base';
import Constants = require('sql/parts/connection/node/constants');
import { QueryEditor } from 'sql/parts/query/editor/queryEditor';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IEditorGroupService } from 'vs/workbench/services/group/common/groupService';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { QueryModelInstance } from 'sql/parts/grid/gridGlobals';
import { SelectBox } from 'vs/base/browser/ui/selectBox/selectBox';
import { EventEmitter } from 'vs/base/common/eventEmitter';
import nls = require('vs/nls');
import * as dom from 'vs/base/browser/dom';
const $ = dom.$;

/**
 * Action class that query-based Actions will extend. This base class automatically handles activating and
 * deactivating the button when a SQL file is opened.
 */
export abstract class QueryActionBase extends Action {

	private _toUnbind: IDisposable[];

	constructor(id: string, protected _editorService: IWorkbenchEditorService, protected _editorGroupService: IEditorGroupService) {
		super(id);
		this._toUnbind = [];
		this._toUnbind.push(this._editorGroupService.onEditorsChanged(() => this._onEditorsChanged()));
	}

	/**
	 * This method is executed when the button is clicked.
	 */
	public abstract run(): TPromise<void>;

	/**
	 * Activates or deactivates the button when the active editor is changed.
	 */
	private _onEditorsChanged(): void {
		let activeEditor = this._editorService.getActiveEditor();
		if (activeEditor && activeEditor instanceof QueryEditor) {
			this.enabled = true;
		} else {
			this.enabled = false;
		}
	}

	public dispose() {
		super.dispose();
		if (this._toUnbind) {
			dispose(this._toUnbind);
			this._toUnbind = null;
		}
	}
}

/**
 * Action class that runs a query in the active SQL text document.
 */
export class RunQueryAction extends QueryActionBase {

	private static EnabledClass = 'runQuery';
	public static ID = 'runQueryAction';

	constructor(_editorService: IWorkbenchEditorService, _editorGroupService: IEditorGroupService) {
		super(RunQueryAction.ID, _editorService, _editorGroupService);

		this.label = nls.localize('runQueryLabel', 'Run Query');
		this.enabled = false;
		this.class = RunQueryAction.EnabledClass;
	}

	public run(): TPromise<void> {
		let activeEditor = this._editorService.getActiveEditor();

		if (activeEditor && activeEditor instanceof QueryEditor) {
			let editor: QueryEditor = <QueryEditor>activeEditor;
			editor.showQueryResultsEditor();
			QueryModelInstance.runQuery(Constants.testUri, undefined, Constants.testUri);
			QueryModelInstance.TEST_sendDummyQueryEvents(Constants.testUri);
		} else {
			throw new Error('Run Query button activated but active editor is not of type QueryEditor');
		}

		return TPromise.as(null);
	}
}

/**
 * Action class that cancels the running query in the current SQL text document.
 */
export class CancelQueryAction extends QueryActionBase {

	private static EnabledClass = 'cancelQuery';
	public static ID = 'cancelQueryAction';

	constructor(_editorService: IWorkbenchEditorService, _editorGroupService: IEditorGroupService) {
		super(CancelQueryAction.ID, _editorService, _editorGroupService);

		this.label = nls.localize('cancelQueryLabel', 'Cancel Query');
		this.enabled = false;
		this.class = CancelQueryAction.EnabledClass;
	}

	public run(): TPromise<void> {
		let activeEditor = this._editorService.getActiveEditor();

		if (activeEditor && activeEditor instanceof QueryEditor) {
			QueryModelInstance.cancelQuery(Constants.testUri);
		}

		return TPromise.as(null);
	}
}

/**
 * Action class that is tied with ListDatabasesActionItem.
 */
export class ListDatabasesAction extends QueryActionBase {

	private static EnabledClass = '';
	public static ID = 'listDatabaseQueryAction';

	constructor(_editorService: IWorkbenchEditorService, _editorGroupService: IEditorGroupService) {
		super(ListDatabasesAction.ID, _editorService, _editorGroupService);

		this.enabled = false;
		this.class = ListDatabasesAction.EnabledClass;
	}

	public run(): TPromise<void> {
		return TPromise.as(null);
	}
}

/*
 * Action item that handles the dropdown (combobox) that lists the available databases.
 * Based off StartDebugActionItem.
 */
export class ListDatabasesActionItem extends EventEmitter implements IActionItem {

	private static testDatabaseList: string[] = ['master', 'testdb', 'anotherTest', 'aVeryLongDatabaseName'];

	public actionRunner: IActionRunner;
	private container: HTMLElement;
	private start: HTMLElement;
	private selectBox: SelectBox;
	private toDispose: IDisposable[];
	private context: any;
	private _databases: string[];
	private _currentDatabaseIndex: number;

	constructor() {
		super();
		this._databases = [];
		this._currentDatabaseIndex = 0;
		this.toDispose = [];
		this.selectBox = new SelectBox([], -1);
		this._registerListeners();

		this._databases = ListDatabasesActionItem.testDatabaseList;
		this._refreshDatabaseList();
	}

	public render(container: HTMLElement): void {
		this.container = container;

		// TODO change this when we find a home for the taskbar
		container.style.top = '-17px';
		this.start = dom.append(container, $('.icon'));
		this.start.tabIndex = 0;
		this.selectBox.render(dom.append(container, $('.configuration')));
	}

	public setActionContext(context: any): void {
		this.context = context;
	}

	public isEnabled(): boolean {
		return true;
	}

	public focus(): void {
		this.start.focus();
	}

	public blur(): void {
		this.container.blur();
	}

	public dispose(): void {
		this.toDispose = dispose(this.toDispose);
	}

	private _refreshDatabaseList(databaseIndex?: number): void {
		this.selectBox.setOptions(this._databases, this._currentDatabaseIndex);
	}

	private _registerListeners(): void {
		this.toDispose.push(this.selectBox.onDidSelect(databaseName => {
			console.log('Selected database: ' + databaseName);
			// TODO hook this up. We will need to inject services into this class
		}));
	}
}