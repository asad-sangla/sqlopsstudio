# Data Management Protocol Specification
The Data Management Protocol specification documents the JSON-RPC message formats.  The message formats are documenting as
interfaces definitions.  The specification is split into various feature areas to group related functionality.

## Connection Messages
Connection messages provide functionaltiy for save connection administration, connection usage and connection grouping.

### Connection Admin
* :leftwards_arrow_with_hook: New Connection
* :leftwards_arrow_with_hook: Edit Connection
* :leftwards_arrow_with_hook: Delete Connection

### Connection Usage
* :leftwards_arrow_with_hook: [connection/connect](#connection_connect)
* :leftwards_arrow_with_hook: [connection/cancelconnect](#connection_cancelconnect)
* :arrow_right: [connection/connectionchanged](#connection_connectionchanged)
* :arrow_right: [connection/complete](#connection_complete)
* :arrow_right: [connection/disconnect](#connection_disconnect)

### Connection Groups
* :leftwards_arrow_with_hook: New Group
* :leftwards_arrow_with_hook: Edit Group
* :leftwards_arrow_with_hook: Delete Group
* :leftwards_arrow_with_hook: Add Connection to Group
* :leftwards_arrow_with_hook: Remove Connection to Group


## Connection Usage

### <a name="connection_connect"></a>`connection/connect`

Establish a connection to a database server.

#### Request

```typescript
    public class ConnectParams
    {
        /// <summary>
        /// A URI identifying the owner of the connection. This will most commonly be a file in the workspace
        /// or a virtual file representing an object in a database.
        /// </summary>
        public string OwnerUri { get; set;  }
        /// <summary>
        /// Contains the required parameters to initialize a connection to a database.
        /// A connection will identified by its server name, database name and user name.
        /// This may be changed in the future to support multiple connections with different
        /// connection properties to the same database.
        /// </summary>
        public ConnectionDetails Connection { get; set; }
    }
```

#### Response

```typescript
    bool
```

### <a name="connection_cancelconnect"></a>`connect/cancelconnect`

Cancel an active connection request.

#### Request

```typescript
    public class CancelConnectParams
    {
        /// <summary>
        /// A URI identifying the owner of the connection. This will most commonly be a file in the workspace
        /// or a virtual file representing an object in a database.
        /// </summary>
        public string OwnerUri { get; set;  }
    }
```

#### Response

```typescript
    bool
```

### <a name="connection_connectionchanged"></a>`connection/connectionchanged`

Connection changed notification

#### Request

```typescript
    public class ConnectionChangedParams
    {
        /// <summary>
        /// A URI identifying the owner of the connection. This will most commonly be a file in the workspace
        /// or a virtual file representing an object in a database.
        /// </summary>
        public string OwnerUri { get; set; }
        /// <summary>
        /// Contains the high-level properties about the connection, for display to the user.
        /// </summary>
        public ConnectionSummary Connection { get; set; }
    }
```

### <a name="connection_complete"></a>`connection/complete`

Connection complete event.

#### Request

```typescript
    public class ConnectionCompleteParams
    {
        /// <summary>
        /// A URI identifying the owner of the connection. This will most commonly be a file in the workspace
        /// or a virtual file representing an object in a database.
        /// </summary>
        public string OwnerUri { get; set;  }

        /// <summary>
        /// A GUID representing a unique connection ID
        /// </summary>
        public string ConnectionId { get; set; }

        /// <summary>
        /// Gets or sets any detailed connection error messages.
        /// </summary>
        public string Messages { get; set; }

        /// <summary>
        /// Error message returned from the engine for a connection failure reason, if any.
        /// </summary>
        public string ErrorMessage { get; set; }

        /// <summary>
        /// Error number returned from the engine for connection failure reason, if any.
        /// </summary>
        public int ErrorNumber { get; set; }

        /// <summary>
        /// Information about the connected server.
        /// </summary>
        public ServerInfo ServerInfo { get; set; }

        /// <summary>
        /// Gets or sets the actual Connection established, including Database Name
        /// </summary>
        public ConnectionSummary ConnectionSummary { get; set; }
    }
```

### <a name="connection_disconnect"></a>`connection/disconnect`

Disconnect the connection specified in the request.

#### Request

```typescript
    public class DisconnectParams
    {
        /// <summary>
        /// A URI identifying the owner of the connection. This will most commonly be a file in the workspace
        /// or a virtual file representing an object in a database.
        /// </summary>
        public string OwnerUri { get; set; }
    }
```

#### Response

```typescript
    bool
```

### <a name="connection_listdatabases"></a>`connection/listdatabases`

Return a list of databases on the server associated with the active connection.

#### Request

```typescript
    public class ListDatabasesParams
    {
        /// <summary>
        /// URI of the owner of the connection requesting the list of databases.
        /// </summary>
        public string OwnerUri { get; set; }
    }
```

#### Response

```typescript
    public class ListDatabasesResponse
    {
        /// <summary>
        /// Gets or sets the list of database names.
        /// </summary>
        public string[] DatabaseNames { get; set; }
    }
```
