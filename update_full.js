var fs = require("fs");
var contents = fs.readFileSync("./dist/widget-common/full/package.json");
// Define to JSON type
var jsonContent = JSON.parse(contents);



const fields = ['module', 'es2020', 'esm2020', 'fesm2020', 'fesm2015', 'es2015', 'node', 'types', 'typings', 'default'];

jsonContent.exports['./full'] = {};
jsonContent.exports['./interface'] = {};

fields.forEach(field => {
  if (jsonContent.exports['.'][field]) {
    const data = './full/' + jsonContent.exports['.'][field].replace('./', '');
    const dataInterface = './interface/' + jsonContent.exports['.'][field].replace('./', '');
    jsonContent.exports['.'][field] = data;
    jsonContent.exports['./full'][field] = data
    jsonContent.exports['./interface'][field] = dataInterface
  }
  if (jsonContent[field]) {
    jsonContent[field] = 'full/' + jsonContent[field];
  }
});

// Allow deep imports from ./full/lib/* so consumers can import individual type files
jsonContent.exports['./full/lib/*'] = {
  types: './full/lib/*.d.ts',
  default: './full/fesm2022/inspark-widget-common.mjs'
};

fs.writeFileSync("./dist/widget-common/package.json", JSON.stringify(jsonContent));
console.log('Done!');
