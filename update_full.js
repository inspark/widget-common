var fs = require("fs");
var contents = fs.readFileSync("./dist/widget-common/full/package.json");
// Define to JSON type
var jsonContent = JSON.parse(contents);


const fields = ['main', 'module', 'es2015', 'esm5', 'esm2015', 'fesm5', 'fesm2015', 'typings', 'metadata'];


fields.forEach(field => {
  jsonContent[field] = 'full/' + jsonContent[field];
});


fs.writeFileSync("./dist/widget-common/package.json", JSON.stringify(jsonContent));
console.log('Done!');
