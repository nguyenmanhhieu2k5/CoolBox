const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function memo(file, name, scope) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name && node.initializer && ts.isCallExpression(node.initializer) && node.initializer.expression.getText(source) === 'useMemo') {
      callback = node.initializer.arguments[0];
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(callback, file + ': missing memo ' + name);
  const code = ts.transpileModule('return (' + callback.getText(source) + ')();', { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  return new Function(...Object.keys(scope), code)(...Object.values(scope));
}

const PanResponder = { create: (handlers) => ({ panHandlers: handlers }) };
const event = (locationX, locationY = 0) => ({ nativeEvent: { locationX, locationY } });
const layout = (width) => ({ nativeEvent: { layout: { width } } });
const changes = [];
const pan = memo('src/components/ui/Slider.tsx', 'pan', { PanResponder });
pan.update(0, (value) => changes.push(value));
pan.onLayout(layout(200));
pan.panHandlers.onPanResponderGrant(event(50));
for (const dx of [50, 50, 1000, -1000]) {
  pan.panHandlers.onPanResponderMove(null, { dx });
}
assert.deepEqual(changes, [25, 50, 100, 0]);
const latest = [];
pan.update(0, (value) => latest.push(value));
pan.panHandlers.onPanResponderGrant(event(100));
pan.onLayout(layout(400));
pan.panHandlers.onPanResponderGrant(event(100));
assert.deepEqual(latest, [50, 25]);
assert.deepEqual(changes, [25, 50, 100, 0]);
pan.onLayout(layout(0));
pan.panHandlers.onPanResponderGrant(event(0));
pan.panHandlers.onPanResponderMove(null, { dx: 1 });
assert.deepEqual(latest.slice(-2), [0, 100]);

for (const size of [200, 320]) {
  const targets = [];
  const dial = memo('src/screens/TemperatureScreen.tsx', 'dial', {
    PanResponder, size, START: 135, SWEEP: 270, TARGET_MIN: 2, TARGET_MAX: 20,
    actions: { setTarget: (value) => targets.push(value) },
  });
  const point = (degrees) => {
    const radians = degrees * Math.PI / 180;
    return { x: size / 2 + Math.cos(radians) * size / 3, y: size / 2 + Math.sin(radians) * size / 3 };
  };
  for (const degrees of [135, 270, 405, 60, 120]) {
    const position = point(degrees);
    dial.panHandlers.onPanResponderGrant(event(position.x, position.y));
  }
  assert.deepEqual(targets, [2, 11, 20, 20, 2]);
  const start = point(135);
  const end = point(405);
  dial.panHandlers.onPanResponderGrant(event(start.x, start.y));
  dial.panHandlers.onPanResponderMove(null, { dx: end.x - start.x, dy: end.y - start.y });
  assert.equal(targets.at(-1), 20);
}

for (const [width, height] of [[320, 640], [512, 800], [0, 0]]) {
  let seed = 11;
  const random = () => ((seed = seed * 16807 % 2147483647) / 2147483647);
  const expected = Array.from({ length: 11 }, () => ({ x: random() * width, y: random() * height, d: 0.5 + random() * 1.1, size: 2 + random() * 3 }));
  const actual = memo('src/screens/SplashScreen.tsx', 'specs', { MOTES: 11, width, height });
  assert.deepEqual(actual, expected);
}

console.log('PASS: slider callbacks, bounds, layout; dial angles, sizes; unchanged cold motes');
