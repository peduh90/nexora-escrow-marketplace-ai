const o={phoneNumber:"254769739216",displayNumber:"0769 739 216"};function i(t){if(!t)return null;let e=String(t).replace(/[^0-9+]/g,"").replace(/^\+/,"");return e.startsWith("0")&&(e="254"+e.slice(1)),e.startsWith("254")||(e="254"+e),/^254[0-9]{9}$/.test(e)?e:null}function a(t,e){const n=`https://wa.me/${t||o.phoneNumber}`;return e?`${n}?text=${encodeURIComponent(e)}`:n}function l(t,e,r){const n=`Hi! I'm interested in "${e}" listed on Nexora Market for KES ${r.toLocaleString()}. Is this still available?`,s=i(t);return a(s||void 0,n)}function p(t){const e=t?`Hello Nexora Market Support 👋

${t}

Please assist me.`:`Hello Nexora Market Support 👋

I need assistance with my account.`;return a(o.phoneNumber,e)}function u(t){window.open(t,"_blank","noopener,noreferrer")}export{o as W,l as a,a as b,p as g,i as n,u as o};
