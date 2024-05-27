import { SelectableValue } from '@grafana/data';
import { OpmonQuery } from 'types';

export const defaultQuery: Partial<OpmonQuery> = {
  host: '- select host -',
  service: '- select service -',
  metric: '- all -',
  timeCut: '24x7',
  resultformat: 'time_series',
  objecttype: 'Host',
  extended_state: false,
  downtimeasok: false,
  hardState: true,
  hostgroup: '- select hostgroup -',
  mode: 0,
  groupby: 'none',
  servicegroup: '- select servicegroup -',
  serviceCatalog: '- select service catalog -',
};

export const queryMode = ['Availability', 'Capacity', 'System', 'Status'];

export const resultFormatOptions: SelectableValue[] = [
  { value: 'time_series', label: 'Time series' },
  { value: 'table', label: 'Table' },
];

export const defaultURL =
  '/opmon/seagull/www/index.php/wsconnector/action/datasource?mod=OPVIEW&shareduid=W1ksbu9/9O95NGvyrgbVYe6yEE2LcgQdivS5PHhiVe0=&q=';

export const HttpHeaders: Headers = new Headers();

export const groupBy = ['none', 'avg', 'max', 'min', 'sum'];

export enum QueryMode {
  AVAIL = 0,
  CP,
  SYSTEM,
  STATUS,
}

export enum Severity {
  NOT_CLASSIFIED = 0,
  INFORMATION,
  WARNING,
  AVERAGE,
  HIGH,
  DISASTER,
}

export enum Datapoint {
  VALUE = 0,
  TS,
}

export enum ObjectType {
  HOST = 'Host',
  SERVICE = 'Service',
  HOSTGROUP = 'Hostgroup',
  SERVICEGROUP = 'Servicegroup',
  CATALOG = 'Service catalog',
  SYSTEM = 'System',
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
}

export enum FormEditorFields {
  QUERY_MODE = 'queryMode',
  OBJECT_TYPE = 'objectType',
  EXTENDED_STATE = 'extendedState',
  DOWNTIME_AS_OK = 'donwTimeAsOK',
  RESULT_FORMAT = 'resultFormat',
  HARD_STATE = 'hardState',
  TIMECUT = 'timeCut',
  GROUP_BY = 'groupBy',
  METRIC = 'metric',
  HOSTGROUP = 'hostGroup',
  SERVICEGROUP = 'serviceGroup',
  CATALOG = 'serviceCatalog',
}
