const componentsToData = require('../codemods/serialize/componentsToData');
const titleComponentsToData = require('../codemods/serialize/titleComponentsToData');
const linkRefsToData = require('../codemods/serialize/linkRefsToData');
const indentedCodeBlock = require('../codemods/indentedCodeBlock');
const unified = require('unified');
const toMDAST = require('remark-parse');
const frontmatter = require('remark-frontmatter');
const remarkMdx = require('remark-mdx');
const remarkMdxjs = require('remark-mdxjs');
const remark2rehype = require('remark-rehype');
const html = require('rehype-stringify');
const format = require('rehype-format');
const vfileGlob = require('vfile-glob');

const createProcessor = ({ codemods = [] } = {}) => {
  const processor = unified()
    .use(toMDAST)
    .use(remarkMdx)
    .use(remarkMdxjs)
    .use(frontmatter, ['yaml'])
    .use(indentedCodeBlock)
    .use(toMDAST)
    .use(remarkMdx);

  codemods.forEach((plugin) => {
    Array.isArray(plugin)
      ? processor.use(plugin[0], plugin[1])
      : processor.use(plugin);
  });

  processor.use(remark2rehype).use(format).use(html);

  return processor;
};

const run = async (file) => {
  const processor = createProcessor({
    codemods: [componentsToData, titleComponentsToData, linkRefsToData],
  });

  try {
    await processor.process(file).then(
      function (file) {
        console.log(String(file));
      },
      function (err) {
        console.error(String(err));
      }
    );
  } catch (e) {
    file.fail(`${e.message}\n${e.stack}`);
  }
};

vfileGlob('./src/content/**/*.mdx').subscribe(async (file) => {
  await run(file);
});

module.exports = createProcessor;
