import {
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MetricFindValue,
  ScopedVars,
  toDataFrame,
  VariableOption,
  VariableWithMultiSupport,
} from '@grafana/data';
import {
  BackendDataSourceResponse,
  BackendSrvRequest,
  FetchResponse,
  getBackendSrv,
  getTemplateSrv,
} from '@grafana/runtime';
import { camelCase, isArray, isObject } from 'lodash';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { defaultQuery, FormEditorFields, ObjectType, QueryMode } from 'static';
import { match, P } from 'ts-pattern';
import { ResponseParser } from './response_parser';
import {
  GenericOptions,
  MetricFindTagKeys,
  MetricFindTagValues,
  OpmonQuery,
  QueryEditorMode,
  QueryRequest,
  SelectableOption,
  VariableQuery,
} from './types';
import { valueFromVariableWithMultiSupport } from './variable/valueFromVariableWithMultiSupport';

export class OpmonDataSource extends DataSourceApi<OpmonQuery, GenericOptions> {
  url: string;
  withCredentials: boolean;
  basicAuth: any;
  headers: any;
  responseParser: ResponseParser;
  defaultEditorMode: QueryEditorMode;
  constructor(instanceSettings: DataSourceInstanceSettings<GenericOptions>) {
    super(instanceSettings);

    this.responseParser = new ResponseParser();
    this.defaultEditorMode = instanceSettings.jsonData?.defaultEditorMode ?? 'code';
    this.url = `${
      instanceSettings.url ?? window.location.origin
    }/opmon/seagull/www/index.php/wsconnector/action/datasource?mod=OPVIEW&shareduid=W1ksbu9/9O95NGvyrgbVYe6yEE2LcgQdivS5PHhiVe0=&q=`;

    this.withCredentials = instanceSettings.withCredentials !== undefined;
    this.headers = { 'Content-Type': 'application/json' };
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }

  query(options: QueryRequest): Promise<DataQueryResponse> {
    const request = this.processTargets(options);
    request.targets = request.targets.filter(
      (target) =>
        !target.hide &&
        target.host &&
        target.service &&
        target.hostgroup &&
        target.servicegroup &&
        target.metric &&
        target.serviceCatalog
    );

    if (request.targets.length === 0) {
      return Promise.resolve({ data: [] });
    }

    request.targets.forEach((target) => {
      if (target.host === defaultQuery.host || target.mode === QueryMode.SYSTEM) {
        target.host = '';
      }

      if (target.service === defaultQuery.service || target.mode === QueryMode.SYSTEM) {
        target.service = '';
      }

      if (target.metric === defaultQuery.metric) {
        target.metric = '';
      }

      target.host = this._fixup_regex(target.host);
      target.service = this._fixup_regex(target.service);
      target.metric = this._fixup_regex(target.metric);
      target.serviceCatalog = this._fixup_regex(target.serviceCatalog);
    });

    // @ts-ignore
    request.adhocFilters = getTemplateSrv().getAdhocFilters(this.name);

    options.scopedVars = { ...this.getVariables(), ...options.scopedVars };

    return lastValueFrom(
      this.doFetch<any[]>({
        url: `${this.url}/query`,
        data: request,
        method: 'POST',
      }).pipe(
        map((response) => {
          response.data = !!response.data[0] ? response.data.map(toDataFrame) : [];

          return response;
        })
      )
    );
  }

  _fixup_regex(value?: string) {
    if (value === undefined || value === null) {
      return value;
    }
    const matches = value.match(/^\/?\^?\{(.*)\}\$?\/?$/);
    if (!matches) {
      return value;
    }
    const values = matches[1].split(/,/).map((value) => value.replace(/\//, '\\/'));

    return '/^(' + values.join('|') + ')$/';
  }

  annotations = {};

  async testDatasource() {
    const errorMessageBase = 'Data source is not working';

    try {
      const response = await lastValueFrom(
        this.doFetch({
          url: this.url,
          method: 'GET',
        }).pipe(map((response) => response))
      );

      if (response.status === 200) {
        return { status: 'success', message: 'Data source is working', title: 'Success' };
      }

      return {
        message: response.statusText ? response.statusText : errorMessageBase,
        status: 'error',
        title: 'Error',
      };
    } catch (err) {
      if (typeof err === 'string') {
        return {
          status: 'error',
          message: err,
        };
      }

      let error = err as FetchResponse;
      let message = error.statusText ?? errorMessageBase;
      if (error.data?.error?.code !== undefined) {
        message += `: ${error.data.error.code}. ${error.data.error.message}`;
      }

      return { status: 'error', message, title: 'Error' };
    }
  }

  metricFindQuery(variableQuery: VariableQuery, options?: any, type?: string): Promise<MetricFindValue[]> {
    const interpolated =
      variableQuery.format === 'json'
        ? JSON.parse(getTemplateSrv().replace(variableQuery.query, undefined, 'json'))
        : {
            type,
            target: getTemplateSrv().replace(variableQuery.query, undefined, 'regex'),
          };

    const variableQueryData = {
      payload: interpolated,
      range: options?.range,
      rangeRaw: options?.rangeRaw,
    };

    return lastValueFrom(
      this.doFetch<BackendDataSourceResponse>({
        url: `${this.url}/variable`,
        data: variableQueryData,
        method: 'POST',
      }).pipe(map((response) => this.responseParser.transformMetricFindResponse(response)))
    );
  }

  metricFindData(type: string, options: OpmonQuery, prependVariables: any): Promise<SelectableOption[]> {
    const mapper = this.mapToLabelValue;
    let url;
    let data = options || {};
    if (type === ObjectType.HOST) {
      url = this.url + '/hosts';
    } else if (type === ObjectType.SERVICE) {
      url = this.url + '/services';
      data.host = this._fixup_regex(getTemplateSrv().replace(options.host));
    } else if (type === FormEditorFields.METRIC || type === 'label') {
      url = this.url + '/metrics';

      if (options.mode === QueryMode.SYSTEM) {
        data.host = '';
        data.service = '';
      } else {
        data.host = this._fixup_regex(getTemplateSrv().replace(options.host));
        data.service = this._fixup_regex(getTemplateSrv().replace(options.service));
      }

      data.objecttype = this._fixup_regex(getTemplateSrv().replace(options.objecttype));
      data.mode = options.mode;
    } else if (type === FormEditorFields.TIMECUT) {
      url = this.url + '/timecuts';
    } else if (type === ObjectType.HOSTGROUP || type === ObjectType.SERVICEGROUP) {
      url = this.url + '/' + type.toLowerCase();
    } else if (type === ObjectType.CATALOG) {
      url = this.url + '/' + camelCase(type);
    }

    if (url === undefined) {
      throw new Error('query syntax error, got no url, unknown type: ' + type);
    }

    const requestOptions = this._requestOptions({
      url: url,
      data: data,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    return lastValueFrom<SelectableOption[]>(
      this.doFetch(requestOptions).pipe(
        map((response) => {
          const data = mapper(response);

          if (isArray(data) && prependVariables) {
            getTemplateSrv()
              .getVariables()
              .forEach((variable) => {
                data.unshift({
                  text: '/^$' + variable.name + '$/',
                  value: '/^$' + variable.name + '$/',
                });
              });
          }
          if (type === 'metric') {
            data.unshift({ label: defaultQuery.metric, value: defaultQuery.metric });
          }
          return data;
        })
      )
    );
  }

  _requestOptions(options: BackendSrvRequest) {
    options = options || {};
    options.headers = options.headers || {};
    if (this.basicAuth || this.withCredentials) {
      options.withCredentials = true;
    }
    if (this.basicAuth) {
      options.headers.Authorization = this.basicAuth;
    }
    return options;
  }

  getTagKeys(options?: any): Promise<MetricFindTagKeys[]> {
    return lastValueFrom(
      this.doFetch<MetricFindTagKeys[]>({
        url: `${this.url}/tag-keys`,
        method: 'POST',
        data: options,
      }).pipe(map((result) => result.data))
    );
  }

  getTagValues(options: any): Promise<MetricFindTagValues[]> {
    return lastValueFrom(
      this.doFetch<MetricFindTagValues[]>({
        url: `${this.url}/tag-values`,
        method: 'POST',
        data: options,
      }).pipe(map((result) => result.data))
    );
  }

  mapToLabelValue(result: any) {
    return result.data.map((d: any, i: number) => {
      if (d && d.text && d.value) {
        return { label: d.text, value: d.text };
      }

      if (isObject(d)) {
        return { label: d, value: d };
      }
      return { label: d, value: d };
    });
  }

  doFetch<T>(options: BackendSrvRequest) {
    options.credentials = this.withCredentials ? 'include' : 'same-origin';
    options.headers = this.headers;

    return getBackendSrv().fetch<T>(options);
  }

  processTarget(q: OpmonQuery, scopedVars?: ScopedVars) {
    const query = { ...q };
    if (typeof query.target === 'string') {
      query.target = getTemplateSrv().replace(query.target.toString(), scopedVars, 'regex');
    }
    return query;
  }

  processTargets(options: QueryRequest) {
    options.targets = options.targets
      .filter((target) => {
        if (target.mode === QueryMode.CP) {
          return target.service !== defaultQuery.service;
        } else {
          return true;
        }
      })
      .map((query) => {
        return this.processTarget(query, options.scopedVars);
      });

    return options;
  }

  getVariables() {
    const variableOptions: Record<VariableWithMultiSupport['id'], VariableOption> = {};

    Object.values(getTemplateSrv().getVariables()).forEach((variable) => {
      if (variable.type === 'adhoc') {
        // These belong to request.adhocFilters
        return;
      }

      if (variable.type === 'system') {
        return;
      }

      const value = match(variable)
        .with({ type: P.union('custom', 'query') }, (v) => valueFromVariableWithMultiSupport(v))
        .with({ type: P.union('constant', 'datasource', 'interval', 'textbox') }, (v) => v.current.value)
        .exhaustive();

      if (value === undefined) {
        return;
      }

      variableOptions[variable.id] = {
        selected: false,
        text: variable.current.text,
        value: value,
      };
    });

    return variableOptions;
  }
}
