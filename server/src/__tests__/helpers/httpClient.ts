import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';

type TestResponse = {
  status: number;
  body: any;
  text: string;
  headers: Record<string, string>;
};

type FileAttachment = {
  fieldName: string;
  value: string | Buffer;
  options?: {
    filename?: string;
    contentType?: string;
  };
};

type AppLike = {
  request: (input: string, init?: RequestInit) => Promise<Response> | Response;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.txt': 'text/plain',
  '.json': 'application/json',
};

const inferMimeType = (filename: string): string => {
  const extension = extname(filename).toLowerCase();
  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream';
};

class RequestBuilder implements PromiseLike<TestResponse> {
  private readonly headers = new Headers();
  private readonly fields: Array<{ name: string; value: string }> = [];
  private readonly files: FileAttachment[] = [];
  private hasJsonBody = false;
  private jsonBody: any;
  private rawBody: any;

  constructor(
    private readonly app: AppLike,
    private readonly method: string,
    private readonly path: string,
  ) {}

  set(name: string, value: string): this {
    this.headers.set(name, value);
    return this;
  }

  send(body: any): this {
    if (body === undefined) {
      return this;
    }

    const isPlainObject =
      typeof body === 'object' &&
      body !== null &&
      !Array.isArray(body) &&
      !(body instanceof ArrayBuffer) &&
      !ArrayBuffer.isView(body) &&
      !(body instanceof FormData) &&
      !(body instanceof URLSearchParams);

    if (isPlainObject) {
      this.hasJsonBody = true;
      this.jsonBody = body;
      if (!this.headers.has('content-type')) {
        this.headers.set('content-type', 'application/json');
      }
      return this;
    }

    if (typeof body === 'string') {
      this.rawBody = body;
      if (!this.headers.has('content-type')) {
        this.headers.set('content-type', 'text/plain');
      }
      return this;
    }

    if (
      body instanceof ArrayBuffer ||
      ArrayBuffer.isView(body) ||
      body instanceof URLSearchParams ||
      body instanceof FormData
    ) {
      this.rawBody = body;
      return this;
    }

    this.hasJsonBody = true;
    this.jsonBody = body;
    if (!this.headers.has('content-type')) {
      this.headers.set('content-type', 'application/json');
    }

    return this;
  }

  field(name: string, value: unknown): this {
    this.fields.push({ name, value: String(value) });
    return this;
  }

  attach(
    fieldName: string,
    value: string | Buffer,
    options?: {
      filename?: string;
      contentType?: string;
    },
  ): this {
    this.files.push({ fieldName, value, options });
    return this;
  }

  async then<TResult1 = TestResponse, TResult2 = never>(
    onfulfilled?: ((value: TestResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<TestResponse> {
    const requestHeaders = new Headers(this.headers);
    const init: RequestInit = {
      method: this.method,
      headers: requestHeaders,
    };

    const hasMultipart = this.fields.length > 0 || this.files.length > 0;
    if (hasMultipart) {
      const formData = new FormData();
      for (const { name, value } of this.fields) {
        formData.append(name, value);
      }

      for (const file of this.files) {
        if (typeof file.value === 'string') {
          const buffer = await readFile(file.value);
          const filename = file.options?.filename ?? basename(file.value);
          const contentType = file.options?.contentType ?? inferMimeType(filename);
          formData.append(
            file.fieldName,
            new File([buffer], filename, { type: contentType }),
          );
        } else {
          const filename = file.options?.filename ?? 'upload.bin';
          const contentType = file.options?.contentType ?? inferMimeType(filename);
          formData.append(
            file.fieldName,
            new File([file.value], filename, { type: contentType }),
          );
        }
      }

      requestHeaders.delete('content-type');
      init.body = formData;
    } else if (this.hasJsonBody) {
      init.body = JSON.stringify(this.jsonBody);
    } else if (this.rawBody !== undefined) {
      init.body = this.rawBody;
    }

    const response = await this.app.request(this.path, init);
    const text = await response.text();

    let body: any = {};
    if (text.length > 0) {
      const contentType = response.headers.get('content-type') ?? '';
      const shouldParseJson =
        contentType.includes('application/json') || contentType.includes('+json');

      if (shouldParseJson) {
        try {
          body = JSON.parse(text);
        } catch {
          body = {};
        }
      } else {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
    }

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    return {
      status: response.status,
      body,
      text,
      headers,
    };
  }
}

const supertest = (app: AppLike) => {
  return {
    get: (path: string) => new RequestBuilder(app, 'GET', path),
    post: (path: string) => new RequestBuilder(app, 'POST', path),
    put: (path: string) => new RequestBuilder(app, 'PUT', path),
    delete: (path: string) => new RequestBuilder(app, 'DELETE', path),
  };
};

export default supertest;
