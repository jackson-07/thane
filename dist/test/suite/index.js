"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const path = require("path");
const Mocha = require("mocha");
const glob_1 = require("glob");
function run() {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true
    });
    const testsRoot = path.resolve(__dirname, '.');
    return new Promise((c, e) => {
        (0, glob_1.glob)('**/*.test.js', { cwd: testsRoot }).then(files => {
            files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));
            try {
                mocha.run(failures => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    }
                    else {
                        c();
                    }
                });
            }
            catch (err) {
                e(err);
            }
        }).catch(err => e(err));
    });
}
//# sourceMappingURL=index.js.map