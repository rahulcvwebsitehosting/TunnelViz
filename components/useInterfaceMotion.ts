import {useEffect,useRef} from 'react';

export function useInterfaceMotion(page:string,panel:string,chapter:number,moduleId:string,enabled:boolean){
 const root=useRef<HTMLDivElement>(null), pointer=useRef(false);
 const previous=useRef({page,panel,chapter,moduleId});
 useEffect(()=>{
  const old=previous.current;previous.current={page,panel,chapter,moduleId};
  if(!enabled||!pointer.current)return;
  const pageChanged=old.page!==page;
  const selector=pageChanged?'main':old.panel!==panel?'.control-body':'.chapter-content';
  const element=root.current?.querySelector(selector);
  if(!element)return;
  element.getAnimations().forEach(a=>a.cancel());
  const animation=element.animate([
   {transformOrigin:'top center',opacity:.35,transform:pageChanged?'perspective(1200px) translateY(16px) rotateX(-2deg)':'translateX(10px)'},
   {transformOrigin:'top center',opacity:1,transform:pageChanged?'perspective(1200px) translateY(0) rotateX(0deg)':'translateX(0)'}
  ],{duration:pageChanged?350:200,easing:'cubic-bezier(.23,1,.32,1)'});
  return()=>animation.cancel();
 },[page,panel,chapter,moduleId,enabled]);
 return {root,onPointerDownCapture:()=>{pointer.current=true;if(root.current)root.current.dataset.input='pointer';},onKeyDownCapture:()=>{pointer.current=false;if(root.current)root.current.dataset.input='keyboard';}};
}
