/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Warning: Do not use the `let` declarator in this file, it breaks our minification

'use strict';

if (window.location.search.indexOf('prof-startup') >= 0) {
	var profiler = require('v8-profiler');
	profiler.startProfiling('renderer', true);
}

/*global window,document,define,Monaco_Loader_Init*/

const startTimer = require('../../../base/node/startupTimers').startTimer;
const path = require('path');
const electron = require('electron');
const remote = electron.remote;
const ipc = electron.ipcRenderer;

// {{SQL CARBON EDIT}}
// SQL global imports
// Require slickgrid
require('slickgrid/slick.core');
const Slick = window.Slick;
require('slickgrid/slick.grid');
require('slickgrid/slick.editors');;
require('reflect-metadata');
require('zone.js');
require('bootstrap');

const _ = require('underscore')._;
const rangy = require('rangy');
const rangyCore = require('rangy/lib/rangy-core');
const rangyTextRange = require('rangy/lib/rangy-textrange');
const prettyData = require('pretty-data');
const Figures = require('figures');

process.lazyEnv = new Promise(function (resolve) {
	const handle = setTimeout(function () {
		resolve();
		console.warn('renderer did not receive lazyEnv in time');
	}, 10000);
	ipc.once('vscode:acceptShellEnv', function (event, shellEnv) {
		clearTimeout(handle);
		assign(process.env, shellEnv);
		resolve(process.env);
	});
	ipc.send('vscode:fetchShellEnv', remote.getCurrentWindow().id);
});

function onError(error, enableDeveloperTools) {
	if (enableDeveloperTools) {
		remote.getCurrentWebContents().openDevTools();
	}

	console.error('[uncaught exception]: ' + error);

	if (error.stack) {
		console.error(error.stack);
	}
}

function assign(destination, source) {
	return Object.keys(source)
		.reduce(function (r, key) { r[key] = source[key]; return r; }, destination);
}

function parseURLQueryArgs() {
	const search = window.location.search || '';

	return search.split(/[?&]/)
		.filter(function (param) { return !!param; })
		.map(function (param) { return param.split('='); })
		.filter(function (param) { return param.length === 2; })
		.reduce(function (r, param) { r[param[0]] = decodeURIComponent(param[1]); return r; }, {});
}

function createScript(src, onload) {
	const script = document.createElement('script');
	script.src = src;
	script.addEventListener('load', onload);

	const head = document.getElementsByTagName('head')[0];
	head.insertBefore(script, head.lastChild);
}

function uriFromPath(_path) {
	var pathName = path.resolve(_path).replace(/\\/g, '/');
	if (pathName.length > 0 && pathName.charAt(0) !== '/') {
		pathName = '/' + pathName;
	}

  // {{SQL CARBON EDIT}}
	/*
	* This hack is for allowing spaces in installation paths
	* when the app is optimized. The reason is the file uri
	* is normalized twice, so we denormalize the path again
	* after encoding when loading
	*/
	return encodeURI('file://' + pathName).replace('%20', ' ');
}

function registerListeners(enableDeveloperTools) {

	// Devtools & reload support
	var listener;
	if (enableDeveloperTools) {
		const extractKey = function (e) {
			return [
				e.ctrlKey ? 'ctrl-' : '',
				e.metaKey ? 'meta-' : '',
				e.altKey ? 'alt-' : '',
				e.shiftKey ? 'shift-' : '',
				e.keyCode
			].join('');
		};

		const TOGGLE_DEV_TOOLS_KB = (process.platform === 'darwin' ? 'meta-alt-73' : 'ctrl-shift-73'); // mac: Cmd-Alt-I, rest: Ctrl-Shift-I
		const RELOAD_KB = (process.platform === 'darwin' ? 'meta-82' : 'ctrl-82'); // mac: Cmd-R, rest: Ctrl-R

		listener = function (e) {
			const key = extractKey(e);
			if (key === TOGGLE_DEV_TOOLS_KB) {
				remote.getCurrentWebContents().toggleDevTools();
			} else if (key === RELOAD_KB) {
				remote.getCurrentWindow().reload();
			}
		};
		window.addEventListener('keydown', listener);
	}

	process.on('uncaughtException', function (error) { onError(error, enableDeveloperTools); });

	return function () {
		if (listener) {
			window.removeEventListener('keydown', listener);
			listener = void 0;
		}
	};
}

function main() {
	const webFrame = require('electron').webFrame;
	const args = parseURLQueryArgs();
	const configuration = JSON.parse(args['config'] || '{}') || {};

	// Correctly inherit the parent's environment
	assign(process.env, configuration.userEnv);

	// Get the nls configuration into the process.env as early as possible.
	var nlsConfig = { availableLanguages: {} };
	const config = process.env['VSCODE_NLS_CONFIG'];
	if (config) {
		process.env['VSCODE_NLS_CONFIG'] = config;
		try {
			nlsConfig = JSON.parse(config);
		} catch (e) { /*noop*/ }
	}

	var locale = nlsConfig.availableLanguages['*'] || 'en';
	if (locale === 'zh-tw') {
		locale = 'zh-Hant';
	} else if (locale === 'zh-cn') {
		locale = 'zh-Hans';
	}

	window.document.documentElement.setAttribute('lang', locale);

	const enableDeveloperTools = (process.env['VSCODE_DEV'] || !!configuration.extensionDevelopmentPath) && !configuration.extensionTestsPath;
	const unbind = registerListeners(enableDeveloperTools);

	// disable pinch zoom & apply zoom level early to avoid glitches
	const zoomLevel = configuration.zoomLevel;
	webFrame.setVisualZoomLevelLimits(1, 1);
	if (typeof zoomLevel === 'number' && zoomLevel !== 0) {
		webFrame.setZoomLevel(zoomLevel);
	}

  // {{SQL CARBON EDIT}}
	// Load the loader and start loading the workbench
	const appRoot = uriFromPath(configuration.appRoot);
	const rootUrl = appRoot + '/out';
  
  // Run the Slick scripts to extend the global Slick object to enable our custom selection behavior
	createScript(rootUrl + '/sql/parts/grid/directives/slick.dragrowselector.js', undefined);
	createScript(rootUrl + '/sql/parts/grid/directives/slick.autosizecolumn.js', undefined);
	createScript(appRoot + '/node_modules/chart.js/dist/Chart.js', undefined);


	function onLoader() {
		define('fs', ['original-fs'], function (originalFS) { return originalFS; }); // replace the patched electron fs with the original node fs for all AMD code
		loaderTimer.stop();

		window.MonacoEnvironment = {};

		const onNodeCachedData = window.MonacoEnvironment.onNodeCachedData = [];

    // {{SQL CARBON EDIT}}
		require.config({
			baseUrl: rootUrl,
			'vs/nls': nlsConfig,
			recordStats: !!configuration.performance,
			nodeCachedDataDir: configuration.nodeCachedDataDir,
			onNodeCachedData: function () { onNodeCachedData.push(arguments); },
			nodeModules: [
				'@angular/common',
				'@angular/core',
				'@angular/forms',
				'@angular/platform-browser',
				'@angular/platform-browser-dynamic',
				'@angular/router',
				'angular2-grid',
				'primeng/primeng',
				'ng2-charts/ng2-charts',
				'rxjs/Observable',
				'rxjs/Subject',
				'rxjs/Observer'
			]
		});

		if (nlsConfig.pseudo) {
			require(['vs/nls'], function (nlsPlugin) {
				nlsPlugin.setPseudoTranslation(nlsConfig.pseudo);
			});
		}

		// Perf Counters
		const timers = window.MonacoEnvironment.timers = {
			isInitialStartup: !!configuration.isInitialStartup,
			hasAccessibilitySupport: !!configuration.accessibilitySupport,
			start: configuration.perfStartTime,
			appReady: configuration.perfAppReady,
			windowLoad: configuration.perfWindowLoadTime,
			beforeLoadWorkbenchMain: Date.now()
		};

		const workbenchMainTimer = startTimer('load:workbench.main');
		require([
			'vs/workbench/electron-browser/workbench.main',
			'vs/nls!vs/workbench/electron-browser/workbench.main',
			'vs/css!vs/workbench/electron-browser/workbench.main'
		], function () {
			workbenchMainTimer.stop();
			timers.afterLoadWorkbenchMain = Date.now();

			process.lazyEnv.then(function () {
				require('vs/workbench/electron-browser/main')
					.startup(configuration)
					.done(function () {
						unbind(); // since the workbench is running, unbind our developer related listeners and let the workbench handle them
					}, function (error) {
						onError(error, enableDeveloperTools);
					});
			});
		});
	}

	// In the bundled version the nls plugin is packaged with the loader so the NLS Plugins
	// loads as soon as the loader loads. To be able to have pseudo translation
	const loaderTimer = startTimer('load:loader');
	if (typeof Monaco_Loader_Init === 'function') {
		//eslint-disable-next-line no-global-assign
		define = Monaco_Loader_Init();
		onLoader();

	} else {
		createScript(rootUrl + '/vs/loader.js', onLoader);
	}
}

main();
