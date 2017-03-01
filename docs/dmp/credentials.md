# Credentials Protocol
The credentials protocol messages provide an extensible mechanism to plug-in credentials providers.

## Credential Messages

Message | Notes
--- | ---
:leftwards_arrow_with_hook: [credential/read](#credential_read) | Read a credential from the credential store.
:leftwards_arrow_with_hook: [credential/save](#credential_save) | Save a credential to the credential store.
:leftwards_arrow_with_hook: [credential/delete](#credential_delete) | Delete a credential from the credential store

### <a name="credential_read"></a>`credential/read`

Read a credential from the credential store.  Request is a Credential object with the CredentialId
property populated with the credential to retrieve.  The Password property will be filled about
in the response.

#### Request

```typescript

    public class Credential
    {
        /// <summary>
        /// A unique ID to identify the credential being saved.
        /// </summary>
        public string CredentialId { get; set; }

        /// <summary>
        /// The Password stored for this credential.
        /// </summary>
        public string Password { get; set; }
    }
```

#### Response

```typescript

    public class Credential
    {
        /// <summary>
        /// A unique ID to identify the credential being saved.
        /// </summary>
        public string CredentialId { get; set; }

        /// <summary>
        /// The Password stored for this credential.
        /// </summary>
        public string Password { get; set; }
    }
```

### <a name="credential_save"></a>`credential/save`

Save a credential to the credential store.  The response is a boolean
value indicating if the credential was successfully saved.

#### Request

```typescript

    public class Credential
    {
        /// <summary>
        /// A unique ID to identify the credential being saved.
        /// </summary>
        public string CredentialId { get; set; }

        /// <summary>
        /// The Password stored for this credential.
        /// </summary>
        public string Password { get; set; }
    }
```

#### Response

```typescript
    bool
```


### <a name="credential_delete"></a>`credential/delete`

Delete a credential from the credential store.  The request Credential object must have the
CredentialId property set to the ID of the credential to delete.  The response is a boolean
value indicating if the credential was deleted.

#### Request

```typescript
    public class Credential
    {
        /// <summary>
        /// A unique ID to identify the credential being saved.
        /// </summary>
        public string CredentialId { get; set; }

        /// <summary>
        /// The Password stored for this credential.
        /// </summary>
        public string Password { get; set; }
    }
```

#### Response

```typescript
    bool
```

## Credentials Provider Interface
The Credentials Provider API is used to register a credentials provider extension with the host application.
The below snippet demonstrates how to implement the the `vscode.CredentialProvider` interface and register
the provider with Carbon.

```typescript

// snipped from vscode.d.ts

export interface Credential {
    /**
     * Unique ID identifying the credential
     */
    credentialId: string;

    /**
     * password
     */
    password: string;
}

export interface CredentialProvider {
    handle: number;

    saveCredential(credentialId: string, password: string): Thenable<boolean>;

    readCredential(credentialId: string): Thenable<Credential>;

    deleteCredential(credentialId: string): Thenable<boolean>;
}

export namespace connections {
    // ...
    export function registerCredentialProvider(
        name: string, provider: CredentialProvider): Disposable;
    // ...
}

// snipped from credentials extension

let provider: vscode.CredentialProvider = {
    handle: 0,
    saveCredential(credentialId: string, password: string): Thenable<boolean> {
        return self._credentialStore.saveCredential(credentialId, password);
    },
    readCredential(credentialId: string): Thenable<vscode.Credential> {
        return self._credentialStore.readCredential(credentialId);
    },
    deleteCredential(credentialId: string): Thenable<boolean> {
        return self._credentialStore.deleteCredential(credentialId);
    }
};

vscode.connections.registerCredentialProvider("Default", provider);
```
