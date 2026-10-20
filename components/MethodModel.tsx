import {ConstructionMethod} from '../types';

/** Small extruded section models, built from rings rather than decorative icons. */
export function MethodModel({method}:{method:ConstructionMethod}) {
 const path=method===ConstructionMethod.TBM
  ?'M32 3a29 29 0 1 0 0 58a29 29 0 1 0 0-58 M32 10a22 22 0 1 1 0 44a22 22 0 1 1 0-44'
  :method===ConstructionMethod.NATM
  ?'M4 60V32a28 28 0 0 1 56 0v28Z M11 53h42V32a21 21 0 0 0-42 0Z'
  :'M4 5h56v55H4Z M11 12v41h42V12Z';
 return <span className="method-model" aria-hidden="true"><span className="method-model-axis">{[0,1,2,3,4].map(i=><svg key={i} className={`model-ring ring-${i}`} viewBox="0 0 64 64"><path d={path} fillRule="evenodd"/></svg>)}</span></span>;
}
