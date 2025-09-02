"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
suite('thane test suite', () => {
    test('extension should activate', async () => {
        const ext = vscode.extensions.getExtension('thane');
        assert.ok(ext);
        await ext?.activate();
    });
});
//# sourceMappingURL=extension.test.js.map