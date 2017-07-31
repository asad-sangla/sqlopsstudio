import {RequestType} from 'dataprotocol-client';

// --------------------------------- < Read Credential Request > -------------------------------------------------

// Read Credential request message callback declaration
export namespace ReadCredentialRequest {
    export const type: RequestType<Credential, Credential, void> = { get method(): string { return 'credential/read'; } };
}

/**
 * Parameters to initialize a connection to a database
 */
export class Credential {
    /**
     * Unique ID identifying the credential
     */
    public credentialId: string;

    /**
     * password
     */
    public password: string;
}

// --------------------------------- </ Read Credential Request > -------------------------------------------------

// --------------------------------- < Save Credential Request > -------------------------------------------------

// Save Credential request message callback declaration
export namespace SaveCredentialRequest {
    export const type: RequestType<Credential, boolean, void> = { get method(): string { return 'credential/save'; } };
}
// --------------------------------- </ Save Credential Request > -------------------------------------------------


// --------------------------------- < Delete Credential Request > -------------------------------------------------

// Delete Credential request message callback declaration
export namespace DeleteCredentialRequest {
    export const type: RequestType<Credential, boolean, void> = { get method(): string { return 'credential/delete'; } };
}
// --------------------------------- </ Delete Credential Request > -------------------------------------------------
