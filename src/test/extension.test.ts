import * as assert from 'assert';
import * as vscode from 'vscode';

suite('thane test suite', () => {

	test('extension should activate', async () => {
        const ext = vscode.extensions.getExtension('thane');
        assert.ok(ext);
        await ext?.activate();
    });

});
