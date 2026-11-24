import {cpSync,mkdirSync} from 'node:fs';
mkdirSync('dist/styles',{recursive:true});
cpSync('src/styles','dist/styles',{recursive:true});

mkdirSync('dist/assets',{recursive:true});
cpSync('src/assets','dist/assets',{recursive:true});
