import React,{useState,useEffect,useId} from 'react';
export function NumberField({label,value,min,max,step=0.1,unit='',onChange,hint}:{label:string;value:number;min:number;max:number;step?:number;unit?:string;onChange:(v:number)=>void;hint?:string}) {
 const id=useId(),[draft,setDraft]=useState(String(value)),[error,setError]=useState('');
 useEffect(()=>{setDraft(String(value));setError('');},[value]);
 const commit=()=>{const n=Number(draft);if(draft.trim()===''||!Number.isFinite(n)||n<min||n>max){setError(`Enter a value from ${min} to ${max}.`);return;}if(step===1&&!Number.isInteger(n)){setError('Enter a whole number.');return;}setError('');onChange(n);};
 return <div className="field"><div className="field-heading"><label htmlFor={id}>{label}</label><span>{unit}</span></div><input id={id} aria-invalid={!!error} aria-describedby={error?`${id}-error`:hint?`${id}-hint`:undefined} type="number" min={min} max={max} step={step} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter'){commit();e.currentTarget.blur();}if(e.key==='Escape'){setDraft(String(value));setError('');}}}/>{hint&&<p id={`${id}-hint`} className="field-hint">{hint}</p>}{error&&<p id={`${id}-error`} className="field-error" role="alert">{error}</p>}</div>;
}
export function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){return <label className="toggle-row"><span>{label}</span><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/></label>;}
