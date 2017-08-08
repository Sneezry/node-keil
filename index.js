const fs = require('fs-plus');
const path = require('path');
const uuid = require('uuid');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const projectFile = process.argv[2];

const xml = fs.readFileSync(projectFile, 'utf8');
const { document } = (new JSDOM(xml)).window;

const outputName = document.getElementsByTagName('TargetName')[0].textContent;
const rootPath = path.join(__dirname, 'out', outputName);
const projectRootPath = path.dirname(projectFile);
const includeRootPath = path.join(rootPath, '_include');

if (!fs.existsSync(rootPath)) {
    fs.makeTreeSync(rootPath);
    fs.mkdirSync(includeRootPath);
} else {
    console.error(`${rootPath} is already existed.`);
    process.exit();
}

var includes = document.getElementsByTagName('IncludePath');
for (let i = 0; i < includes.length; i++) {
    include = includes[i].textContent;
    if (!include) {
        continue;
    }
    includePaths = include.split(';');
    for (let j = 0; j < includePaths.length; j++) {
        let includePath = includePaths[j];
        if (!includePath) {
            continue;
        }
        let absoluteIncludePath = path.join(projectRootPath, includePath);
        let tempPath = path.join(includeRootPath, uuid());
        console.log(`coping include files from ${absoluteIncludePath} to ${tempPath}...`);
        fs.copySync(absoluteIncludePath, tempPath);
    }
}

var groups = document.getElementsByTagName('Group');
for (let i = 0; i < groups.length; i++) {
    let group = groups[i];
    let relativePath = path.join(rootPath, group.getElementsByTagName('GroupName')[0].textContent);
    let files = group.getElementsByTagName('File');
    if (files.length > 0) {
        fs.makeTreeSync(relativePath);
    }
    for (let j = 0; j < files.length; j++) {
        let file = files[j];
        let fileName = file.getElementsByTagName('FileName')[0].textContent;
        let filePath = file.getElementsByTagName('FilePath')[0].textContent;
        let fileSourcePath = path.join(projectRootPath, filePath);
        let fileOutPath = path.join(relativePath, fileName);
        console.log(`coping file ${fileSourcePath} to ${fileOutPath}...`);
        fs.writeFileSync(fileOutPath, fs.readFileSync(fileSourcePath));
    }
}
