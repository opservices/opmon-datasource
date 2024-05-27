import { QueryEditorProps } from '@grafana/data';
import { EditorRow } from '@grafana/experimental';
import React, { ComponentType } from 'react';
import { OpmonDataSource } from '../DataSource';

import { InlineField, InlineSwitch, Select } from '@grafana/ui';
import { FormEditorFields, ObjectType, QueryMode, defaultQuery, resultFormatOptions } from 'static';
import { GenericOptions, OpmonQuery } from '../types';
import { useQueryEditorContainer } from './QueryEditorContainer.logic';

export type Props = QueryEditorProps<OpmonDataSource, OpmonQuery, GenericOptions>;

export const QueryEditorContainer: ComponentType<Props> = ({ onChange, onRunQuery, query, datasource }) => {
  const {
    queryModeOptions,
    objectTypeOptions,
    timeCutOptions,
    groupByOptions,
    hostOptions,
    serviceOptions,
    hostgroupOptions,
    serviceGroupOptions,
    catalogOptions,
    metricOptions,
    getOptions,
    updateOptions,
    isLoading,
  } = useQueryEditorContainer({
    onChange,
    onRunQuery,
    query,
    datasource,
  });

  return (
    <>
      <EditorRow>
        <InlineField label="Query Mode:">
          <Select
            options={queryModeOptions}
            defaultValue={defaultQuery.mode}
            allowCustomValue
            value={query.mode}
            onChange={(editorMode) =>
              onChange({
                ...query,
                mode: editorMode.value,
                objecttype:
                  editorMode.value === QueryMode.CP && query.objecttype === ObjectType.HOST
                    ? ObjectType.SERVICE
                    : query.objecttype,
              })
            }
          />
        </InlineField>
        <InlineField label="Object Type:">
          <Select
            options={objectTypeOptions}
            defaultValue={defaultQuery.objecttype}
            allowCustomValue
            value={query.objecttype}
            onChange={(objectType) => onChange({ ...query, objecttype: objectType.value })}
          />
        </InlineField>
        {query.mode === QueryMode.STATUS && query.objecttype !== ObjectType.CATALOG && (
          <InlineField label="Extended State:">
            <InlineSwitch
              sizes="md"
              label="Extended State:"
              value={query.extended_state}
              onChange={(v) => onChange({ ...query, extended_state: v.currentTarget.checked })}
            />
          </InlineField>
        )}
        {(query.mode === QueryMode.AVAIL || query.mode === QueryMode.CP) && renderAvailAndCPFields()}
        <InlineField label="Format As:">
          <Select
            options={resultFormatOptions}
            allowCustomValue
            defaultValue={defaultQuery.resultformat}
            value={query.resultformat}
            onChange={(v) => onChange({ ...query, resultformat: v.value })}
          />
        </InlineField>
        {(query.mode === QueryMode.STATUS || query.mode === QueryMode.AVAIL) && (
          <InlineField label="HARD states only:">
            <InlineSwitch
              sizes="md"
              label="HARD states only:"
              value={query.hardState}
              onChange={(v) => onChange({ ...query, hardState: v.currentTarget.checked })}
            />
          </InlineField>
        )}
      </EditorRow>
      <EditorRow>
        {query.mode !== QueryMode.SYSTEM && renderObjectSelectionFields()}
        <InlineField label="Metric:">
          <Select
            options={metricOptions}
            onOpenMenu={() => getOptions(FormEditorFields.METRIC)}
            isLoading={isLoading === FormEditorFields.METRIC}
            defaultValue={defaultQuery.metric}
            placeholder={defaultQuery.metric}
            value={query.metric}
            onChange={(v) => onChange({ ...query, metric: v.label })}
          />
        </InlineField>
      </EditorRow>
    </>
  );

  function renderObjectSelectionFields() {
    switch (query.objecttype) {
      case ObjectType.HOST:
      case ObjectType.SERVICE:
        return renderHostServiceFields();

      case ObjectType.HOSTGROUP:
        return (
          <>
            <InlineField label="Host group:">
              <Select
                options={hostgroupOptions}
                onOpenMenu={() => {
                  hostgroupOptions.length === 0 && getOptions(ObjectType.HOSTGROUP);
                }}
                isLoading={isLoading === ObjectType.HOSTGROUP}
                defaultValue={defaultQuery.hostgroup}
                placeholder={defaultQuery.hostgroup}
                value={query.hostgroup}
                onChange={(v) => {
                  onChange({ ...query, hostgroup: v.label, host: defaultQuery.host, service: defaultQuery.service });
                  updateOptions(ObjectType.HOST)([]);
                  updateOptions(ObjectType.SERVICE)([]);
                }}
              />
            </InlineField>
            {query.mode === QueryMode.CP && renderHostServiceFields()}
          </>
        );
      case ObjectType.SERVICEGROUP:
        return (
          <>
            <InlineField label="Service group:">
              <Select
                options={serviceGroupOptions}
                onOpenMenu={() => {
                  serviceGroupOptions.length === 0 && getOptions(ObjectType.SERVICEGROUP);
                }}
                isLoading={isLoading === ObjectType.SERVICEGROUP}
                defaultValue={defaultQuery.servicegroup}
                placeholder={defaultQuery.servicegroup}
                value={query.servicegroup}
                onChange={(v) => {
                  onChange({ ...query, servicegroup: v.label, host: defaultQuery.host, service: defaultQuery.service });
                  updateOptions(ObjectType.HOST)([]);
                  updateOptions(ObjectType.SERVICE)([]);
                }}
              />
            </InlineField>
            {query.mode === QueryMode.CP && renderHostServiceFields()}
          </>
        );
      case ObjectType.CATALOG:
        return (
          <InlineField label="Catalog:">
            <Select
              options={catalogOptions}
              onOpenMenu={() => {
                catalogOptions.length === 0 && getOptions(ObjectType.CATALOG);
              }}
              isLoading={isLoading === ObjectType.CATALOG}
              defaultValue={defaultQuery.serviceCatalog}
              placeholder={defaultQuery.serviceCatalog}
              value={query.serviceCatalog}
              onChange={(v) => onChange({ ...query, serviceCatalog: v.label })}
            />
          </InlineField>
        );
      default:
        return renderHostServiceFields();
    }
  }

  function renderHostServiceFields() {
    const { objecttype } = query;

    return (
      <>
        <InlineField label="Host:">
          <Select
            options={hostOptions}
            isLoading={isLoading === ObjectType.HOST}
            onOpenMenu={() => {
              hostOptions.length === 0 && getOptions(ObjectType.HOST);
            }}
            defaultValue={defaultQuery.host}
            placeholder={defaultQuery.host}
            value={query.host}
            onChange={(v) => {
              onChange({ ...query, host: v.label, service: defaultQuery.service });
              updateOptions(ObjectType.SERVICE)([]);
            }}
          />
        </InlineField>
        {objecttype !== ObjectType.HOST && objecttype !== ObjectType.CATALOG && (
          <InlineField label="Service:">
            <Select
              options={serviceOptions}
              isLoading={isLoading === ObjectType.SERVICE}
              onOpenMenu={() => {
                serviceOptions.length === 0 && getOptions(ObjectType.SERVICE);
              }}
              defaultValue={defaultQuery.service}
              placeholder={defaultQuery.service}
              value={query.service}
              onChange={(v) => onChange({ ...query, service: v.label })}
            />
          </InlineField>
        )}
      </>
    );
  }

  function renderAvailAndCPFields() {
    return (
      <>
        {query.mode === QueryMode.AVAIL && (
          <InlineField label="Downtime/Breach as OK:">
            <InlineSwitch
              sizes="md"
              label="Downtime/Breach as OK:"
              value={query.downtimeasok}
              onChange={(v) => onChange({ ...query, downtimeasok: v.currentTarget.checked })}
            />
          </InlineField>
        )}
        <InlineField label="Timecut:">
          <Select
            options={timeCutOptions}
            isLoading={isLoading === FormEditorFields.TIMECUT}
            defaultValue={defaultQuery.timeCut}
            placeholder={defaultQuery.timeCut}
            value={query.timeCut}
            onChange={(v) => onChange({ ...query, timeCut: v.label })}
          />
        </InlineField>
        {query.mode === QueryMode.CP && (
          <InlineField label="Group By:">
            <Select
              options={groupByOptions}
              defaultValue={defaultQuery.groupby}
              placeholder={defaultQuery.groupby}
              value={query.groupby}
              onChange={(v) => onChange({ ...query, groupby: v.value })}
            />
          </InlineField>
        )}
      </>
    );
  }
};
