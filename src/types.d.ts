import { DataQuery, DataQueryRequest, DataSourceJsonData, MetricFindValue, SelectableValue } from '@grafana/data';
import { TemplateSrv as GrafanaTemplateSrv } from '@grafana/runtime';

declare module '@grafana/runtime' {
  export interface TemplateSrv extends GrafanaTemplateSrv {
    getAdhocFilters(datasourceName: string): any;
  }
}

export interface QueryRequest extends DataQueryRequest<OpmonQuery> {
  adhocFilters?: any[];
}

export interface OpmonQuery extends DataQuery {
  editorMode?: QueryEditorMode;
  alias?: string;
  target?: string;
  payload?: string | { [key: string]: unknown };
  path?: string;
  host?: string;
  service?: string;
  metric?: string;
  timeCut?: string;
  resultformat?: string;
  downtimeasok?: boolean;
  objecttype?: string;
  extended_state?: boolean;
  hardState?: boolean;
  hostgroup?: string;
  servicegroup?: string;
  serviceCatalog?: string;
  mode?: number;
  alias?: string;
  groupby?: string;
}

export interface GenericOptions extends DataSourceJsonData {
  defaultEditorMode?: QueryEditorMode;
}

export interface VariableQuery {
  query: string;
  format: 'string' | 'json';
}

export interface MetricFindTagKeys extends MetricFindValue {
  key: string;
  type: string;
  text: string;
}

export interface MetricFindTagValues extends MetricFindValue {
  key: string;
  text: string;
}

export interface MetricPayloadConfig {
  width?: number;
  placeholder?: string;
  name: string;
  label?: string;
  type?: 'input' | 'select' | 'multi-select' | 'textarea';
  reloadMetric?: boolean;
  options?: SelectableValue<string | number>[];
}

export interface MetricConfig {
  label: string;
  value: string;
  payloads: MetricPayloadConfig[];
}

export type QueryEditorMode = 'code' | 'builder';

export type SelectableOption = {
  text: string;
  value: string | number;
};
