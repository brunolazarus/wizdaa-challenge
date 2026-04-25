import{n as e}from"./chunk-BEldbCjX.js";import{n as t,t as n}from"./BalanceCell-OgJ7mZ5W.js";var r,i,a,o,s,c,l,u,d,f;e((()=>{t(),r=new Date().toISOString(),i=new Date(Date.now()-9e4).toISOString(),a={employeeId:`emp-alice`,locationId:`loc-nyc`,balance:15,unit:`days`,version:1},o={component:n,tags:[`autodocs`],argTypes:{balance:{control:`object`,description:`HcmBalance from the query cache, or undefined while loading`},isFetching:{control:`boolean`,description:`True while a background poll is in-flight`},justUpdated:{control:`boolean`,description:`True for ~3s after a background poll lands a new version`}}},s={args:{balance:{...a,asOf:r},isFetching:!1,justUpdated:!1}},c={args:{balance:void 0,isFetching:!0,justUpdated:!1}},l={args:{balance:{...a,asOf:i},isFetching:!1,justUpdated:!1}},u={args:{balance:{...a,asOf:r},isFetching:!0,justUpdated:!1}},d={args:{balance:{...a,asOf:r},isFetching:!1,justUpdated:!0}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    balance: {
      ...baseBalance,
      asOf: now
    },
    isFetching: false,
    justUpdated: false
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    balance: undefined,
    isFetching: true,
    justUpdated: false
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    balance: {
      ...baseBalance,
      asOf: staleAsOf
    },
    isFetching: false,
    justUpdated: false
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    balance: {
      ...baseBalance,
      asOf: now
    },
    isFetching: true,
    justUpdated: false
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    balance: {
      ...baseBalance,
      asOf: now
    },
    isFetching: false,
    justUpdated: true
  }
}`,...d.parameters?.docs?.source}}},f=[`Default`,`Loading`,`Stale`,`Refreshing`,`JustUpdated`]}))();export{s as Default,d as JustUpdated,c as Loading,u as Refreshing,l as Stale,f as __namedExportsOrder,o as default};