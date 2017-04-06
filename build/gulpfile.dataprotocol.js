/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

const gulp = require('gulp');
const util = require('./lib/util');

gulp.task('clean-mssql-extension', util.rimraf('extensions/mssql/node_modules'));
gulp.task('clean-credentials-extension', util.rimraf('extensions/credentials/node_modules'));
gulp.task('clean-client', util.rimraf('dataprotocol-node/client/node_modules'));
gulp.task('clean-jsonrpc', util.rimraf('dataprotocol-node/jsonrpc/node_modules'));
gulp.task('clean-server', util.rimraf('dataprotocol-node/server/node_modules'));
gulp.task('clean-types', util.rimraf('dataprotocol-node/types/node_modules'));
gulp.task('clean-protocol', ['clean-mssql-extension', 'clean-credentials-extension', 'clean-client', 'clean-jsonrpc', 'clean-server', 'clean-types']);

