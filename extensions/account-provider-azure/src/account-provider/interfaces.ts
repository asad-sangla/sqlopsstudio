'use strict';

import * as data from 'data';

/**
 * Represents a tenant (an Azure Active Directory instance) to which a user has access
 */
export interface Tenant {
	/**
	 * Globally unique identifier of the tenant
	 */
	id: string;

	/**
	 * Display name of the tenant
	 */
	displayName: string;

	/**
	 * Identifier of the user in the tenant
	 */
	userId: string;
}

/**
 * Represents a resource exposed by an Azure Active Directory
 */
export interface Resource {
	/**
	 * Identifier of the resource
	 */
	id: string;

	/**
	 * Endpoint url used to access the resource
	 */
	endpoint: string;
}

/**
 * Represents the arguments that identify an instantiation of the AAD account provider
 */
export interface Arguments {
	/**
	 * Host of the authority
	 */
	host: string;

	/**
	 * Identifier of the client application
	 */
	clientId: string;
}

/**
 * Represents settings for an AAD account provider
 */
export interface Settings {
	/**
	 * Host of the authority
	 */
	host?: string;

	/**
	 * Identifier of the client application
	 */
	clientId?: string;

	/**
	 * Identifier of the resource to request when signing in
	 */
	signInResourceId?: string;

	/**
	 * Information that describes the AAD graph resource
	 */
	graphResource?: Resource;

	/**
	 * Information that describes the Azure resource management resource
	 */
	armResource?: Resource;

	/**
	 * A list of tenant IDs to authenticate against. If defined, then these IDs will be used
	 * instead of querying the tenants endpoint of the armResource
	 */
	adTenants?: string[];

	// AuthorizationCodeGrantFlowSettings //////////////////////////////////

	/**
	 * An optional site ID that brands the interactive aspect of sign in
	 */
	siteId?: string;

	/**
	 * Redirect URI that is used to signify the end of the interactive aspect of sign it
	 */
	redirectUri?: string;
}

export interface AzureAccountProviderMetadata extends data.AccountProviderMetadata {
	/**
	 * Azure specific account provider settings.
	 */
	settings: Settings;
}
