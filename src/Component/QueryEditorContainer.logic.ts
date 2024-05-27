import { SelectableValue } from '@grafana/data';
import { values } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { FormEditorFields, ObjectType, QueryMode, defaultQuery, groupBy, queryMode } from 'static';
import { Props } from './QueryEditorContainer';

type QueryEditorContainerProps = Pick<Props, 'onChange' | 'onRunQuery' | 'query' | 'datasource'>;

export const useQueryEditorContainer = ({ onChange, onRunQuery, query, datasource }: QueryEditorContainerProps) => {
  const [timeCutOptions, setTimeCutOptions] = useState<SelectableValue[]>([]);
  const [hostOptions, setHostOptions] = useState<SelectableValue[]>([]);
  const [serviceOptions, setServiceOptions] = useState<SelectableValue[]>([]);
  const [hostgroupOptions, setHostgroupOptions] = useState<SelectableValue[]>([]);
  const [serviceGroupOptions, setServiceGroupOptions] = useState<SelectableValue[]>([]);
  const [catalogOptions, setCatalogOptions] = useState<SelectableValue[]>([]);
  const [metricOptions, setMetricOptions] = useState<SelectableValue[]>([]);

  const [isLoading, setIsLoading] = useState<string | undefined>();

  const {
    mode,
    host,
    service,
    hostgroup,
    servicegroup,
    serviceCatalog,
    hardState,
    extended_state,
    downtimeasok,
    timeCut,
    metric,
    objecttype,
  } = query;

  const objectTypeOptions = useMemo(() => {
    return values(ObjectType)
      .map((objectType: string) => ({ label: objectType, value: objectType }))
      .filter(
        (filteredObject: SelectableValue) =>
          (mode !== undefined &&
            [QueryMode.AVAIL, QueryMode.STATUS].includes(mode) &&
            filteredObject.value !== ObjectType.SYSTEM) ||
          (mode === QueryMode.CP &&
            [ObjectType.SERVICE, ObjectType.HOSTGROUP, ObjectType.SERVICEGROUP].includes(filteredObject.value)) ||
          (mode === QueryMode.SYSTEM && filteredObject.value !== ObjectType.CATALOG)
      );
  }, [mode]);

  const groupByOptions = groupBy.map((value) => ({ label: value, value }));
  const queryModeOptions = queryMode.map((value, index) => ({ label: value, value: index }));

  const updateOptions = (objectType: string) => {
    switch (objectType) {
      case ObjectType.HOST:
        return setHostOptions;
      case ObjectType.SERVICE:
        return setServiceOptions;
      case ObjectType.HOSTGROUP:
        return setHostgroupOptions;
      case ObjectType.SERVICEGROUP:
        return setServiceGroupOptions;
      case ObjectType.CATALOG:
        return setCatalogOptions;
      case FormEditorFields.METRIC:
        return setMetricOptions;
      case FormEditorFields.TIMECUT:
        return setTimeCutOptions;
    }

    return () => {};
  };

  const getOptions = (field: string) => {
    setIsLoading(field);
    const update = updateOptions(field);
    if (field && update) {
      datasource
        .metricFindData(field, query, true)
        .then((value) => update(value))
        .finally(() => setIsLoading(undefined));
    }
  };

  useEffect(() => {
    onChange({
      ...query,
      mode: mode ?? defaultQuery.mode,
      objecttype: objecttype ?? defaultQuery.objecttype,
      downtimeasok: downtimeasok ?? defaultQuery.downtimeasok,
      timeCut: timeCut ?? defaultQuery.timeCut,
      resultformat: query.resultformat ?? defaultQuery.resultformat,
      hardState: hardState ?? defaultQuery.hardState,
      host: host ?? defaultQuery.host,
      service: service ?? defaultQuery.service,
      hostgroup: hostgroup ?? defaultQuery.hostgroup,
      servicegroup: servicegroup ?? defaultQuery.servicegroup,
      serviceCatalog: serviceCatalog ?? defaultQuery.serviceCatalog,
      metric: metric ?? defaultQuery.metric,
      groupby: query.groupby ?? defaultQuery.groupby,
    });
    getOptions(ObjectType.HOST);
    objecttype === ObjectType.SERVICE && getOptions(ObjectType.SERVICE);
    objecttype === ObjectType.HOSTGROUP && getOptions(ObjectType.HOSTGROUP);
    objecttype === ObjectType.SERVICEGROUP && getOptions(ObjectType.SERVICEGROUP);
    objecttype === ObjectType.CATALOG && getOptions(ObjectType.CATALOG);

    getOptions(FormEditorFields.TIMECUT);
  }, []);

  useEffect(
    () => onRunQuery(),
    [
      mode,
      objecttype,
      host,
      service,
      hostgroup,
      servicegroup,
      serviceCatalog,
      timeCut,
      groupBy,
      hardState,
      extended_state,
      downtimeasok,
    ]
  );

  return {
    queryModeOptions,
    objectTypeOptions,
    timeCutOptions,
    groupByOptions,
    hostOptions,
    serviceOptions,
    getOptions,
    updateOptions,
    hostgroupOptions,
    serviceGroupOptions,
    catalogOptions,
    metricOptions,
    isLoading,
  };
};
