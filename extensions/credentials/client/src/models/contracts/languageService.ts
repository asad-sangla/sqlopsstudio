import {NotificationType} from 'dataprotocol-client';
import {Telemetry} from '../telemetry';

// ------------------------------- < Telemetry Sent Event > ------------------------------------

/**
 * Event sent when the language service send a telemetry event
 */
export namespace TelemetryNotification {
    export const type: NotificationType<TelemetryParams> = { get method(): string { return 'telemetry/sqlevent'; } };
}

/**
 * Update event parameters
 */
export class TelemetryParams {
    public params: {
        eventName: string;
        properties: Telemetry.ITelemetryEventProperties;
        measures: Telemetry.ITelemetryEventMeasures;
    };
}

// ------------------------------- </ Telemetry Sent Event > ----------------------------------

// ------------------------------- < Status Event > ------------------------------------

/**
 * Event sent when the language service send a status change event
 */
export namespace StatusChangedNotification {
    export const type: NotificationType<StatusChangeParams> = { get method(): string { return 'textDocument/statusChanged'; } };
}

/**
 * Update event parameters
 */
export class StatusChangeParams {
    /**
     * URI identifying the text document
     */
    public ownerUri: string;

    /**
     * The new status of the document
     */
    public status: string;
}

// ------------------------------- </ Status Sent Event > ----------------------------------
