import assert from 'node:assert/strict';
import { freshProject, parseProject } from './project';

const project = freshProject();
assert.deepEqual(parseProject(JSON.stringify(project)), project);
for (const raw of ['{', 'null', '[]', '{}', '{"version":999}']) assert.equal(parseProject(raw), null);
for (const patch of [{width:0}, {depth:1000}, {segmentCount:6.5}, {wallThickness:-1}, {method:'invalid'}]) {
  assert.equal(parseProject(JSON.stringify({...project,design:{...project.design,...patch}})), null);
}
assert.equal(parseProject(JSON.stringify({...project,simulation:{...project.simulation,volumeLossPercent:-1}})), null);
assert.equal(parseProject(JSON.stringify({...project,layers:[project.layers[0],project.layers[0]]})), null);
assert.equal(parseProject(JSON.stringify({...project,layers:[{...project.layers[0],color:'url(invalid)'}]})), null);
const copy = freshProject(); copy.layers[0].thickness = 99;
assert.equal(project.layers[0].thickness, 15);
console.log('Project storage tests passed: round-trip, corrupt data, unsupported version, input ranges, fractional segments, duplicate layers, and independent defaults.');
