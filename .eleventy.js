const htmlmin = require('html-minifier-terser');

module.exports = function(eleventyConfig) {

  // Site config
  const siteConfig = {
    title: "warawara",
    author: {
      name: "warawara",
    },
    description: "warawara",
    navigation: [
      { name: "app", url: "/app.html" },
      { name: "privacy", url: "/privacy.html" },
      { name: "terms", url: "/terms.html" },
    ],
  };

  // Add site data to global data
  eleventyConfig.addGlobalData("site", siteConfig);

  // Add passthrough copy
  eleventyConfig.addPassthroughCopy("src/images");

  // HTML minify (production only)
  if (process.env.ELEVENTY_ENV === 'production') {
    eleventyConfig.addTransform('htmlmin', async function(content, outputPath) {
      if (outputPath && outputPath.endsWith('.html')) {
        try {
          return await htmlmin.minify(content, {
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyCSS: true,
            minifyJS: true,
            collapseWhitespace: true,
            conservativeCollapse: true,
          });
        } catch (err) {
          console.error('HTML minification failed:', err);
          return content;
        }
      }
      return content;
    });
  }

  return {
    templateFormats: ["md", "njk", "html"],
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
  };
};