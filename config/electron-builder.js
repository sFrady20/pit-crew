/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  directories: {
    output: 'dist/app',
    buildResources: 'build',
    app: 'dist/source',
  },
  files: [
    '**/*',
    '!src/renderer/public/**/*',
    '!renderer/graphics/**/*',
    '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
    '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
    '!**/node_modules/*.d.ts',
    '!**/node_modules/.bin',
    '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
    '!.editorconfig',
    '!**/._*',
    '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
    '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
    '!**/{appveyor.yml,.travis.yml,circle.yml}',
    '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}',
  ],
  extraFiles: [{ from: 'dist/source/renderer', to: 'public' }],
  win: {
    target: 'nsis',
  },
};
