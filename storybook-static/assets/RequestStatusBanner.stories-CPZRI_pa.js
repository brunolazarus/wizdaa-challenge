import{n as e}from"./chunk-BEldbCjX.js";import{n as t,t as n}from"./RequestStatusBanner-pFBqLdZI.js";var r,i,a,o,s,c,l,u,d;e((()=>{t(),{fn:r}=__STORYBOOK_MODULE_TEST__,i={component:n,tags:[`autodocs`],argTypes:{status:{control:`select`,options:[`idle`,`optimistic-pending`,`hcm-confirmed`,`hcm-rejected`,`hcm-conflict`,`hcm-silently-wrong`,`optimistic-rolled-back`],description:`Current state of the time-off request`},onReset:{description:`Called when the user dismisses the banner`}},args:{onReset:r()}},a={args:{status:`optimistic-pending`}},o={args:{status:`hcm-confirmed`}},s={args:{status:`hcm-rejected`}},c={args:{status:`hcm-conflict`}},l={args:{status:`hcm-silently-wrong`}},u={args:{status:`optimistic-rolled-back`}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    status: 'optimistic-pending'
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    status: 'hcm-confirmed'
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    status: 'hcm-rejected'
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    status: 'hcm-conflict'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    status: 'hcm-silently-wrong'
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    status: 'optimistic-rolled-back'
  }
}`,...u.parameters?.docs?.source}}},d=[`OptimisticPending`,`HcmConfirmed`,`HcmRejected`,`HcmConflict`,`HcmSilentlyWrong`,`OptimisticRolledBack`]}))();export{o as HcmConfirmed,c as HcmConflict,s as HcmRejected,l as HcmSilentlyWrong,a as OptimisticPending,u as OptimisticRolledBack,d as __namedExportsOrder,i as default};