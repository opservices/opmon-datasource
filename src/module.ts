import { DataSourcePlugin } from '@grafana/data';
import { ConfigEditor } from './Component/ConfigEditor';
import { QueryEditorContainer } from './Component/QueryEditorContainer';
import { OpmonDataSource } from './DataSource';
import { GenericOptions, OpmonQuery } from './types';

export const plugin = new DataSourcePlugin<OpmonDataSource, OpmonQuery, GenericOptions>(OpmonDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditorContainer);
