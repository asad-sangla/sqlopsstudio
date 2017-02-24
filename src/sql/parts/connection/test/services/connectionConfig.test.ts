/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
 
'use strict';


import * as TypeMoq from 'typemoq';
import { ConnectionConfig } from 'sql/parts/connection/node/connectionconfig';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { ConfigurationTarget, IConfigurationValue } from 'vs/workbench/services/configuration/common/configurationEditing';
import { IWorkspaceConfigurationValue } from 'vs/workbench/services/configuration/common/configuration';
import { WorkspaceConfigurationTestService } from './workspaceConfigurationTestService';
import { ConfigurationEditingService } from 'vs/workbench/services/configuration/node/configurationEditingService';
import * as Constants from 'sql/parts/connection/node/constants';
import { IConnectionProfileGroup } from 'sql/parts/connection/node/connectionProfileGroup';
import { TPromise } from 'vs/base/common/winjs.base';
import * as assert from 'assert';

suite('ConnectionConfig tests', () => {
    let configValueToConcat: IWorkspaceConfigurationValue<IConnectionProfileGroup[]> = {
            workspace: [{
                name: 'g1',
                children: [{
                    name: 'g1-1',
                    children: undefined
                }]
            }],
            user: [{
                name: 'g2',
                children: [{
                    name: 'g2-1',
                    children: undefined
                }]
            },
            {
                name: 'g3',
                children: [{
                    name: 'g3-1',
                    children: undefined
                }]
            }],
            value: [],
            default: []
        };

    let configValueToMerge: IWorkspaceConfigurationValue<IConnectionProfileGroup[]> = {
            workspace: [{
                name: 'g1',
                children: [{
                    name: 'g1-1',
                    children: [{
                        name: 'g1-1-1',
                        children: undefined
                    }]
                }]
            }],
            user: [{
                name: 'g2',
                children: [{
                    name: 'g2-1',
                    children: undefined
                }]
            },
            {
                name: 'g1',
                children: [{
                    name: 'g1-2',
                    children: undefined
                }]
            }],
            value: [],
            default: []
        };

    let connections: IWorkspaceConfigurationValue<IConnectionProfile[]> = {
        workspace: [{
            serverName: 'server1',
                databaseName: 'database',
                userName: 'user',
                password: 'password',
                authenticationType: '',
            savePassword: true,
            groupName: undefined
        }


        ],
        user: [{
            serverName: 'server2',
                databaseName: 'database',
                userName: 'user',
                password: 'password',
                authenticationType: '',
            savePassword: true,
            groupName: undefined
        }, {
            serverName: 'server3',
                databaseName: 'database',
                userName: 'user',
                password: 'password',
                authenticationType: '',
            savePassword: true,
            groupName: undefined
        }
        ],
        value: [

        ],
        default: []
    };

    function groupsAreEqual(groups1: IConnectionProfileGroup[], groups2: IConnectionProfileGroup[]): Boolean {
        if(!groups1 && !groups2) {
            return true;
        } else if((!groups1 && groups2 && groups2.length === 0) ||  (!groups2 && groups1 && groups1.length === 0)) {
            return true;
        }

        if(groups1.length !== groups2.length) {
            return false;
        }

        let areEqual = true;

        groups1.map(g1 => {
            if(areEqual) {
                let g2 = groups2.find(g => g.name === g1.name);
                if(!g2) {
                    areEqual = false;
                } else {
                    let result = groupsAreEqual(g1.children, g2.children);
                    if(result === false) {
                        areEqual = false;
                    }
                }
            }
        });

        return areEqual;
    }

    test('allGroups should return groups from user and workspace settings', () => {

        let configEditingServiceMock = TypeMoq.Mock.ofType(ConfigurationEditingService);
        let workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);

        workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfile[] | IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName))
        .returns(() => configValueToConcat);

        let config = new ConnectionConfig(configEditingServiceMock.object, workspaceConfigurationServiceMock.object);
        let allGroups = config.getAllGroups();


        assert.notEqual(allGroups, undefined);
        assert.equal(allGroups.length, configValueToConcat.workspace.length + configValueToConcat.user.length);
    });

    test('allGroups should merge groups from user and workspace settings', () => {
        let configEditingServiceMock = TypeMoq.Mock.ofType(ConfigurationEditingService);
        let workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);
        let expectedAllGroups: IConnectionProfileGroup[] = [{
                name: 'g2',
                children: [{
                    name: 'g2-1',
                    children: undefined
                }]
            },
            {
                name: 'g1',
                children: [{
                    name: 'g1-2',
                    children: undefined
                },
                {
                    name: 'g1-1',
                    children: [{
                        name: 'g1-1-1',
                        children: undefined
                    }]
                }]
            }];

        workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfile[] | IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName))
        .returns(() => configValueToMerge);

        let config = new ConnectionConfig(configEditingServiceMock.object, workspaceConfigurationServiceMock.object);
        let allGroups = config.getAllGroups();


        assert.notEqual(allGroups, undefined);
        assert.equal(groupsAreEqual(allGroups, expectedAllGroups), true);
    });

    test('addConnection should add the new profile to user settings if does not exist', done => {
        let configEditingServiceMock = TypeMoq.Mock.ofType(ConfigurationEditingService);
        let workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);
        let newProfile: IConnectionProfile = {
            serverName: 'new server',
                databaseName: 'database',
                userName: 'user',
                password: 'password',
                authenticationType: '',
            savePassword: true,
            groupName: undefined
        };

        let expectedNumberOfConnections = connections.user.length + 1;

        workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfile[] | IConnectionProfileGroup[]>(Constants.connectionsArrayName))
        .returns(() => connections);
        let nothing: void;
        configEditingServiceMock.setup(x => x.writeConfiguration(ConfigurationTarget.USER, TypeMoq.It.isAny())).returns(() => TPromise.as<void>(nothing));


        let config = new ConnectionConfig(configEditingServiceMock.object, workspaceConfigurationServiceMock.object);
        config.addConnection(newProfile).then(success => {
            configEditingServiceMock.verify(y => y.writeConfiguration(ConfigurationTarget.USER,
            TypeMoq.It.is<IConfigurationValue>(c => (c.value as IConnectionProfile[]).length === expectedNumberOfConnections)), TypeMoq.Times.once());
            done();
        }).catch(error => {
            assert.fail();
            done();
        });
    });

    test('addConnection should not add the new profile to user settings if already exists', done => {
        let configEditingServiceMock = TypeMoq.Mock.ofType(ConfigurationEditingService);
        let workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);
        let newProfile = connections.user[0];

        let expectedNumberOfConnections = connections.user.length;

        workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfile[] | IConnectionProfileGroup[]>(Constants.connectionsArrayName))
        .returns(() => connections);
        let nothing: void;
        configEditingServiceMock.setup(x => x.writeConfiguration(ConfigurationTarget.USER, TypeMoq.It.isAny())).returns(() => TPromise.as<void>(nothing));


        let config = new ConnectionConfig(configEditingServiceMock.object, workspaceConfigurationServiceMock.object);
        config.addConnection(newProfile).then(success => {
            configEditingServiceMock.verify(y => y.writeConfiguration(ConfigurationTarget.USER,
            TypeMoq.It.is<IConfigurationValue>(c => (c.value as IConnectionProfile[]).length === expectedNumberOfConnections)), TypeMoq.Times.once());
            done();
        }).catch(error => {
            assert.fail();
            done();
        });
    });

    test('addConnection should add the new group to user settings if does not exist', done => {
        let configEditingServiceMock = TypeMoq.Mock.ofType(ConfigurationEditingService);
        let workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);
        let newProfile: IConnectionProfile = {
            serverName: 'new server',
                databaseName: 'database',
                userName: 'user',
                password: 'password',
                authenticationType: '',
            savePassword: true,
            groupName: 'g2/g2-2'
        };

        let expectedNumberOfConnections = connections.user.length + 1;
        let expectedNumberOfGroups = configValueToConcat.user.length + 1;

        workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfile[] | IConnectionProfileGroup[]>(Constants.connectionsArrayName))
        .returns(() => connections);
        let nothing: void;
        configEditingServiceMock.setup(x => x.writeConfiguration(ConfigurationTarget.USER, TypeMoq.It.isAny())).returns(() => TPromise.as<void>(nothing));
        workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfile[] | IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName))
        .returns(() => configValueToConcat);

        let config = new ConnectionConfig(configEditingServiceMock.object, workspaceConfigurationServiceMock.object);
        config.addConnection(newProfile).then(success => {
            configEditingServiceMock.verify(y => y.writeConfiguration(ConfigurationTarget.USER,
            TypeMoq.It.is<IConfigurationValue>(c => (c.value as IConnectionProfile[]).length === expectedNumberOfConnections)), TypeMoq.Times.once());
            configEditingServiceMock.verify(y => y.writeConfiguration(ConfigurationTarget.USER,
            TypeMoq.It.is<IConfigurationValue>(c => (c.value as IConnectionProfileGroup[]).length === expectedNumberOfGroups)), TypeMoq.Times.once());
            done();
        }).catch(error => {
            assert.fail();
            done();
        });
    });

    test('getConnections should return connections from user and workspace settings given getWorkspaceConnections set to true', () => {
        let configEditingServiceMock = TypeMoq.Mock.ofType(ConfigurationEditingService);
        let workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);
        let getWorkspaceConnections: boolean = true;

        workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfile[] | IConnectionProfileGroup[]>(Constants.connectionsArrayName))
        .returns(() => connections);



        let config = new ConnectionConfig(configEditingServiceMock.object, workspaceConfigurationServiceMock.object);
        let allConnections = config.getConnections(getWorkspaceConnections);
        assert.equal(allConnections.length, connections.user.length + connections.workspace.length);
    });

    test('getConnections should return connections from user settings given getWorkspaceConnections set to false', () => {
        let configEditingServiceMock = TypeMoq.Mock.ofType(ConfigurationEditingService);
        let workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);
        let getWorkspaceConnections: boolean = false;

        workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfile[] | IConnectionProfileGroup[]>(Constants.connectionsArrayName))
        .returns(() => connections);



        let config = new ConnectionConfig(configEditingServiceMock.object, workspaceConfigurationServiceMock.object);
        let allConnections = config.getConnections(getWorkspaceConnections);
        assert.equal(allConnections.length, connections.user.length);
    });
});

