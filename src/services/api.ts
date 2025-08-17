// frontend/src/api.ts
import { type EndpointInfo } from "@/types/endpoint";

import {
  apiFetch,
  ApiError,
  type HttpMethod,
  API_URL,
} from "@/services/apiFetch";

export const fetchAllEndpoints = async (): Promise<EndpointInfo[]> => {
  try {
    const data = await apiFetch<EndpointInfo[]>("/endpoints", {
      method: "GET",
      baseURL: API_URL,
    });
    return data;
  } catch (error) {
    console.error("Error fetching all endpoints:", error);

    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
};

export const fetchEndpointsByController = async (
  controllerName: string,
): Promise<EndpointInfo[]> => {
  try {
    const data = await apiFetch<EndpointInfo[]>(
      `/endpoints/${controllerName}`,
      {
        method: "GET",
        baseURL: API_URL,
      },
    );
    return data;
  } catch (error) {
    console.error(
      `Error fetching endpoints for controller ${controllerName}:`,
      error,
    );

    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
};

interface ExecutionResult {
  status: number;
  headers: Record<string, string>;
  body: any;
  error: string | null;
}

export const executeEndpointRequest = async (
  method: string,
  endpointUrl: string,
  body?: any,
  headers?: Record<string, string>,
): Promise<ExecutionResult> => {
  try {
    const httpMethod = method as HttpMethod;

    const resBody = await apiFetch<any, any>(endpointUrl, {
      method: httpMethod,
      body: body,
      headers: headers,
      baseURL: API_URL,
    });

    const status = resBody === undefined ? 204 : 200;
    const responseHeaders: Record<string, string> = {};

    return {
      status,
      headers: responseHeaders,
      body: resBody,
      error: null,
    };
  } catch (error: any) {
    let status = 0;
    let responseBody: any = null;
    let errorMessage: string = "Unknown error during request execution.";
    const responseHeaders: Record<string, string> = {};

    if (error instanceof ApiError) {
      status = error.status;
      responseBody = error.details;
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = JSON.stringify(error);
    }

    return {
      status,
      headers: responseHeaders,
      body: responseBody,
      error: errorMessage,
    };
  }
};
