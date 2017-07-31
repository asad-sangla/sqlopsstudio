import {ILanguageClientHelper, SharedConstants, SqlToolsServiceClient} from 'extensions-modules';
import {ServerOptions, TransportKind} from 'dataprotocol-client';
import {workspace} from 'vscode';

export default class LanguageClientHelper implements ILanguageClientHelper {
    public createServerOptions(servicePath): ServerOptions {
        let serverArgs = [];
        let serverCommand: string = servicePath;
        if (servicePath.endsWith('.dll')) {
            serverArgs = [servicePath];
            serverCommand = 'dotnet';
        }

        // Enable diagnostic logging in the service if it is configured
        let config = workspace.getConfiguration(SqlToolsServiceClient.constants.extensionConfigSectionName);
        if (config) {
            let logDebugInfo = config[SharedConstants.configLogDebugInfo];
            if (logDebugInfo) {
                serverArgs.push('--enable-logging');
            }
        }

        // run the service host using dotnet.exe from the path
        let serverOptions: ServerOptions = {  command: serverCommand, args: serverArgs, transport: TransportKind.stdio  };
        return serverOptions;
    }

}