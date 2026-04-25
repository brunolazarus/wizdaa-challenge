import{n as e}from"./chunk-BEldbCjX.js";import{n as t,t as n}from"./BalanceFreshnessIndicator-BtRm9S10.js";var r,i,a,o,s,c,l;e((()=>{t(),r=new Date().toISOString(),i=new Date(Date.now()-9e4).toISOString(),a={component:n,tags:[`autodocs`],argTypes:{asOf:{control:`text`,description:`ISO 8601 timestamp of last known-good balance read from HCM`},isStale:{control:`boolean`,description:`True when asOf exceeds the 60s manager staleness threshold`},isFetching:{control:`boolean`,description:`True while a re-fetch is in-flight`}}},o={args:{asOf:r,isStale:!1,isFetching:!1}},s={args:{asOf:i,isStale:!0,isFetching:!1}},c={args:{asOf:i,isStale:!0,isFetching:!0}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    asOf: now,
    isStale: false,
    isFetching: false
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    asOf: staleAsOf,
    isStale: true,
    isFetching: false
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    asOf: staleAsOf,
    isStale: true,
    isFetching: true
  }
}`,...c.parameters?.docs?.source}}},l=[`Fresh`,`Stale`,`Refreshing`]}))();export{o as Fresh,c as Refreshing,s as Stale,l as __namedExportsOrder,a as default};