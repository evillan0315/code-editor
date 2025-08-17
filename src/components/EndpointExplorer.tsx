// frontend/src/EndpointExplorer.tsx
/*import React, { useEffect, useState, useMemo } from "react";
import {
  fetchAllEndpoints,
  fetchEndpointsByController,
  executeEndpointRequest,
} from "@/services/api";
import type { EndpointInfo, SwaggerParameterDTO } from "@/types/endpoint";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism"; // A nice, light theme

interface RequestInput {
  path: string;
  query: Record<string, string>;
  body: string;
}

const EndpointExplorer: React.FC = () => {
  const [allEndpoints, setAllEndpoints] = useState<EndpointInfo[]>([]);
  const [selectedController, setSelectedController] = useState<string | "all">(
    "all",
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for the currently expanded/testing endpoint
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointInfo | null>(
    null,
  );
  const [requestInput, setRequestInput] = useState<RequestInput>({
    path: "",
    query: {},
    body: "",
  });
  const [response, setResponse] = useState<any>(null);
  const [responseLoading, setResponseLoading] = useState<boolean>(false);

  useEffect(() => {
    const getEndpoints = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAllEndpoints();
        setAllEndpoints(data);
        // Pre-populate input for the first endpoint if it's the only one
        if (data.length > 0) {
          setActiveEndpoint(data[0]);
          setRequestInput((prev) => ({
            ...prev,
            path: data[0].path,
          }));
        }
      } catch (err: any) {
        setError(`Failed to fetch endpoints: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    getEndpoints();
  }, []);

  const controllers = useMemo(() => {
    const names = new Set(allEndpoints.map((ep) => ep.controller));
    return ["all", ...Array.from(names).sort()];
  }, [allEndpoints]);

  const filteredEndpoints = useMemo(() => {
    if (selectedController === "all") {
      return allEndpoints;
    }
    return allEndpoints.filter((ep) => ep.controller === selectedController);
  }, [allEndpoints, selectedController]);

  const handleEndpointClick = (endpoint: EndpointInfo) => {
    setActiveEndpoint(endpoint);
    setResponse(null); // Clear previous response
    // Initialize request path and query/body based on selected endpoint
    setRequestInput({
      path: endpoint.path,
      query:
        endpoint.swaggerInfo?.parameters
          ?.filter((p) => p.in === "query")
          .reduce((acc, p) => ({ ...acc, [p.name]: "" }), {}) || {},
      body: endpoint.swaggerInfo?.requestBody
        ? JSON.stringify(
            endpoint.swaggerInfo.requestBody.content?.["application/json"]
              ?.schema || {},
            null,
            2,
          )
        : "",
    });
  };

  const handleQueryParamChange = (name: string, value: string) => {
    setRequestInput((prev) => ({
      ...prev,
      query: { ...prev.query, [name]: value },
    }));
  };

  const handleExecute = async () => {
    if (!activeEndpoint) return;

    setResponseLoading(true);
    setResponse(null);

    let fullUrl = requestInput.path;

    // Replace path parameters if any
    activeEndpoint.swaggerInfo?.parameters
      ?.filter((p) => p.in === "path")
      .forEach((p) => {
        const paramValue = requestInput.query[p.name]; // Reusing query state for path params
        if (paramValue) {
          fullUrl = fullUrl.replace(`:${p.name}`, paramValue);
        }
      });

    // Add query parameters
    const queryParams = new URLSearchParams();
    for (const key in requestInput.query) {
      if (
        requestInput.query[key] &&
        !activeEndpoint.swaggerInfo?.parameters?.some(
          (p) => p.name === key && p.in === "path",
        ) // Don't add path params as query params
      ) {
        queryParams.append(key, requestInput.query[key]);
      }
    }
    if (queryParams.toString()) {
      fullUrl += `?${queryParams.toString()}`;
    }

    let requestBodyParsed: any = undefined;
    if (
      activeEndpoint.method === "POST" ||
      activeEndpoint.method === "PUT" ||
      activeEndpoint.method === "PATCH"
    ) {
      try {
        requestBodyParsed = JSON.parse(requestInput.body);
      } catch (e) {
        alert("Invalid JSON in request body.");
        setResponseLoading(false);
        return;
      }
    }

    try {
      const res = await executeEndpointRequest(
        activeEndpoint.method,
        fullUrl,
        requestBodyParsed,
      );
      setResponse(res);
    } catch (err: any) {
      setResponse({
        status: 0,
        headers: {},
        body: null,
        error: err.message || "Request failed",
      });
    } finally {
      setResponseLoading(false);
    }
  };

  if (loading) return <div>Loading endpoints...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div className="endpoint-explorer-container">
      <h1>API Endpoint Explorer</h1>

      <div className="controller-selector">
        <label htmlFor="controller-select">Select Controller:</label>
        <select
          id="controller-select"
          value={selectedController}
          onChange={(e) => setSelectedController(e.target.value)}
        >
          {controllers.map((ctrl) => (
            <option key={ctrl} value={ctrl}>
              {ctrl === "all" ? "All Controllers" : ctrl}
            </option>
          ))}
        </select>
      </div>

      <div className="main-content">
        <div className="endpoint-list">
          <h2>Endpoints</h2>
          {filteredEndpoints.length === 0 ? (
            <p>No endpoints found for this controller.</p>
          ) : (
            <ul>
              {filteredEndpoints.map((endpoint, index) => (
                <li
                  key={index}
                  className={activeEndpoint === endpoint ? "active" : ""}
                >
                  <button onClick={() => handleEndpointClick(endpoint)}>
                    <span className={`method-tag ${endpoint.method}`}>
                      {endpoint.method}
                    </span>{" "}
                    {endpoint.path}
                    <br />
                    <small>{endpoint.swaggerInfo?.summary}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="endpoint-tester">
          {activeEndpoint ? (
            <>
              <h2>Test Endpoint: {activeEndpoint.handler}</h2>
              <div className="endpoint-details">
                <p>
                  <strong>Method:</strong> {activeEndpoint.method}
                </p>
                <p>
                  <strong>Path:</strong>{" "}
                  <input
                    type="text"
                    value={requestInput.path}
                    onChange={(e) =>
                      setRequestInput((prev) => ({
                        ...prev,
                        path: e.target.value,
                      }))
                    }
                    className="path-input"
                    title="Modify path for path parameters (e.g., /users/123)"
                  />
                </p>
                {activeEndpoint.swaggerInfo?.summary && (
                  <p>
                    <strong>Summary:</strong>{" "}
                    {activeEndpoint.swaggerInfo.summary}
                  </p>
                )}
                {activeEndpoint.swaggerInfo?.description && (
                  <p>
                    <strong>Description:</strong>{" "}
                    {activeEndpoint.swaggerInfo.description}
                  </p>
                )}

                {activeEndpoint.swaggerInfo?.parameters &&
                  activeEndpoint.swaggerInfo.parameters.length > 0 && (
                    <div className="param-section">
                      <h3>Parameters:</h3>
                      {activeEndpoint.swaggerInfo.parameters.map((p) => (
                        <div key={p.name} className="param-input">
                          <label>
                            {p.name} ({p.in}) {p.required ? "*" : ""}:
                          </label>
                          <input
                            type="text"
                            value={requestInput.query[p.name] || ""} // Reusing query state for both path and query params
                            onChange={(e) =>
                              handleQueryParamChange(p.name, e.target.value)
                            }
                            placeholder={p.description || p.type}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                {(activeEndpoint.method === "POST" ||
                  activeEndpoint.method === "PUT" ||
                  activeEndpoint.method === "PATCH") &&
                  activeEndpoint.swaggerInfo?.requestBody && (
                    <div className="body-section">
                      <h3>Request Body (JSON):</h3>
                      <textarea
                        value={requestInput.body}
                        onChange={(e) =>
                          setRequestInput((prev) => ({
                            ...prev,
                            body: e.target.value,
                          }))
                        }
                        rows={10}
                        cols={50}
                        placeholder="Enter JSON body here..."
                      ></textarea>
                      {activeEndpoint.swaggerInfo.requestBody.description && (
                        <small>
                          {activeEndpoint.swaggerInfo.requestBody.description}
                        </small>
                      )}
                    </div>
                  )}

                <button
                  onClick={handleExecute}
                  disabled={responseLoading}
                  className="execute-button"
                >
                  {responseLoading ? "Executing..." : "Execute Request"}
                </button>

  
                {response && (
                  <div className="response-section">
                    <h3>Response:</h3>
                    <div className="response-status">
                      <strong>Status:</strong> {response.status}
                    </div>
                    {response.error && (
                      <div className="response-error" style={{ color: "red" }}>
                        <strong>Error:</strong> {response.error}
                      </div>
                    )}
                    <div className="response-body">
                      <h4>Body:</h4>
                      <SyntaxHighlighter
                        language="json"
                        style={coy}
                        showLineNumbers
                      >
                        {response.body
                          ? JSON.stringify(response.body, null, 2)
                          : "No body"}
                      </SyntaxHighlighter>
                    </div>
                    <div className="response-headers">
                      <h4>Headers:</h4>
                      <SyntaxHighlighter
                        language="json"
                        style={coy}
                        showLineNumbers
                      >
                        {response.headers
                          ? JSON.stringify(response.headers, null, 2)
                          : "No headers"}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p>Select an endpoint from the list to test it.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EndpointExplorer;
*/
