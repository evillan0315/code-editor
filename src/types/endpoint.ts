// frontend/src/types/endpoints.ts

export interface SwaggerParameterDTO {
  name: string;
  in: string; // 'query', 'header', 'path', 'body'
  description?: string;
  required?: boolean;
  type?: string;
  schema?: any;
}

export interface SwaggerResponseDTO {
  statusCode: string;
  description?: string;
  type?: string;
  schema?: any;
}

export interface SwaggerRequestBodyDTO {
  description?: string;
  required?: boolean;
  content?: {
    [media: string]: {
      schema: any;
    };
  };
}

export interface EndpointInfo {
  method: string;
  path: string;
  controller: string;
  handler: string;
  swaggerInfo?: {
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: SwaggerParameterDTO[];
    responses?: SwaggerResponseDTO[];
    requestBody?: SwaggerRequestBodyDTO;
    dto?: string;
  };
}
