const componentActions=new Set(['focus_component','focus_subcomponent','isolate_component','show_subcomponents','highlight_system']);
const simpleActions=new Set(['explode_model','assemble_model','reset_camera','open_evidence']);
export function validateAction(action,registry){
 if(!action||typeof action!=='object'||Array.isArray(action)||typeof action.type!=='string')return null;
 const allowed=componentActions.has(action.type)||action.type==='open_evidence'?['type','component']:action.type==='show_relationship'?['type','relationship']:action.type==='start_story_step'?['type','step']:['type'];
 if(Object.keys(action).some(k=>!allowed.includes(k)))return null;
 if(componentActions.has(action.type))return typeof action.component==='string'&&registry.has(action.component)?{type:action.type,component:registry.get(action.component).key}:null;
 if(simpleActions.has(action.type))return action.component===undefined||typeof action.component==='string'&&registry.has(action.component)?{type:action.type,...(action.component?{component:registry.get(action.component).key}:{})}:null;
 if(action.type==='show_relationship'&&typeof action.relationship==='string'&&Object.hasOwn(registry.experience.relationships,action.relationship))return{type:action.type,relationship:action.relationship};
 if(action.type==='start_story_step'&&registry.experience.story.some(s=>s.id===action.step))return{type:action.type,step:action.step};
 return null;
}
/** Only a fixed vocabulary reaches the engine. JSON never becomes JavaScript. */
export function createActionController({registry,getEngine,getContext,onEvidence,onStory}={}){
 let epoch=0;
 return{cancel(){epoch++;getEngine()?.cancelPending?.();},async execute(input,{contextToken}={}){
  const command=validateAction(input,registry),ctx=getContext();if(!command||ctx.mission.id!==registry.mission.id||!ctx.inExplorer||contextToken!==undefined&&contextToken!==ctx.contextToken)return false;
  const token=++epoch;if(command.type==='open_evidence'){onEvidence(command.component);return token===epoch&&getContext().mission.id===registry.mission.id;}
  const engine=getEngine();if(!engine||engine.state.available===false)return false;
  switch(command.type){
   case 'focus_component':if(await engine.focusComponent(command.component)===false)return false;break;
   case 'focus_subcomponent':case 'show_subcomponents':if(!registry.get(command.component).path[0].scene)onEvidence(command.component);else if(await engine.choose(command.component)===false)return false;break;
   case 'isolate_component':if(await engine.choose(command.component)===false)return false;if(token!==epoch||engine.state.selected!==command.component)return false;engine.isolateComponent();break;
   case 'highlight_system':if(await engine.focusComponent(command.component)===false)return false;break;
   case 'explode_model':engine.explodeModel();break;
   case 'assemble_model':engine.assembleModel();break;
   case 'reset_camera':engine.overview();break;
   case 'show_relationship':engine.showRelationship(command.relationship);break;
   case 'start_story_step':if(await onStory(command.step)===false)return false;break;
  }
  const live=getContext();return (token===epoch||command.type==='start_story_step')&&live.inExplorer&&live.mission.id===registry.mission.id&&(contextToken===undefined||contextToken===live.contextToken);
 }};
}
