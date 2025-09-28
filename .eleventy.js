const { DateTime } = require("luxon");
const GoogleSearchConsoleStats = require('./src/_plugins/google-search-console');
const htmlmin = require('html-minifier-terser');

module.exports = function(eleventyConfig) {
  
  
  // Get URL information from environment variables
  const siteName = process.env.USERNAME || 'dakimakura';
  const neocitiesUrl = process.env.NEOCITIES_URL || `https://${siteName}.neocities.org`;
  const nekowebUrl = process.env.NEKOWEB_URL || `https://${siteName}.nekoweb.org`;
  
  // Add global data
  eleventyConfig.addGlobalData("siteName", siteName);
  eleventyConfig.addGlobalData("neocitiesUrl", neocitiesUrl);
  eleventyConfig.addGlobalData("nekowebUrl", nekowebUrl);
  
  // Neocities API credentials
  const neocitiesApiToken = process.env.NEOCITIES_API_KEY;
  
  eleventyConfig.addGlobalData("neocitiesApiToken", neocitiesApiToken);
  
  // Add Posts data to global data
  let postsData = { posts: [] };
  try {
    const fs = require('fs');
    const postsPath = 'src/posts.json';
    if (fs.existsSync(postsPath)) {
      const postsContent = fs.readFileSync(postsPath, 'utf8');
      postsData = JSON.parse(postsContent);
      console.log('Posts data loaded globally:', postsData.posts.length, 'posts');
    }
  } catch (error) {
    console.warn('Failed to load posts data globally:', error.message);
  }
  
  eleventyConfig.addGlobalData("postsData", postsData);

  // Register ContentTools API endpoints - moved to serverOptions.middleware

  
  // Initialize search console stats
  let searchConsoleStats = {
    totalClicks: 0,
    totalImpressions: 0,
    averageCtr: 0,
    lastUpdated: new Date().toISOString()
  };

  // Initialize search console stats
  const initSearchConsoleStats = async () => {
    try {
      const gsc = new GoogleSearchConsoleStats();
      const siteUrls = [
        process.env.NEOCITIES_URL || 'https://dakimakura.neocities.org'
      ];
      
      const stats = await gsc.getRecentStats(siteUrls);
      if (stats && stats.totals) {
        searchConsoleStats = {
          totalClicks: stats.totals.totalClicks,
          totalImpressions: stats.totals.totalImpressions,
          averageCtr: stats.totals.averageCtr,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (error) {
      console.warn('Failed to initialize search console stats:', error.message);
    }
  };

  // Initialize search console stats
  initSearchConsoleStats();

  // Add site config data
  const siteConfig = {
    title: "dakimakura",
    author: {
      name: "sheepycrunch",
    },
    description: "Personal Blog",
    social: {
    },
    stats: {
      visitors: 0,
      searchConsole: searchConsoleStats
    },
    navigation: [
      { name: "txt", url: "/txt.html" },
      { name: "gallery", url: "/gallery.html" },
      { name: "links", url: "/archive.html" },
      { name: "search", url: "/search.html" },
    ],
    authorInfo: {
      introduction: "This blog was established as an alternative to existing commercial blogs."
    },
    aboutSite: {
      text: "Aiming for regular daily writing."
    }
  };

  // Calculate post count
  const calculatePostCount = (collections) => {
    let count = 0;
    
    // If posts.json exists, add post count
    if (collections.posts) {
      count += collections.posts.length;
    }
    
    // Basic pages 
    const basicPages = ['txt', 'gallery', 'archive', 'links', 'search', 'login'];
    count += basicPages.length;
    
    return count;
  };

  // Add site data to global data
  eleventyConfig.addGlobalData("site", siteConfig);
  
  // Add post count filter
  eleventyConfig.addFilter("postCount", function(collections) {
    return calculatePostCount(collections);
  });
  
  // Add site data to global data
  const siteData = {
    site: {
      title: siteConfig.title,
      author: siteConfig.author.name,
      description: "Personal Blog",
    },
    sections: {
      selfIntroduction: "About Me",
      aboutSite: "About This Site",
      snsLinks: "Links",
      content: "Categories",
      siteInfo: "Site Information",
      latestUpdates: "Latest Updates",
      search: "Search"
    },
    author: {
      name: siteConfig.author.name,
      introduction: "This blog was established as an alternative to existing commercial blogs."
    },
    aboutSite: {
      text: "Aiming for regular daily writing."
    },
    search: {
      title: "Search",
      description: "Search posts by tags or keywords.",
      placeholder: "Search by tags or keywords...",
      clearButton: "Clear",
      noResults: "No search results found."
    },
    txt: {
      title: "Posts",
      description: "Check out text posts."
    },
    links: {
      title: "Links",
      description: "Useful links are collected here. Feel free to link to this site."
    },
    gallery: {
      title: "Gallery",
      description: "Check out gallery images."
    },
    banners: {
      title: "Banners",
      description: "Site banners and promotional materials."
    },
    stats: {
      posts: "Posts",
      visitors: "Visitors",
      lastUpdate: "Last Update"
    }
  };

  eleventyConfig.addGlobalData("i18n", siteData);
  
  
  // Add dualImage filter
  eleventyConfig.addFilter("dualImage", function(imagePath) {
    if (!imagePath) return "";
    
    // If image path is already an absolute URL, return it
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Check if Neocities is deployed
    const isNeocitiesDeploy = process.env.NEOCITIES_DEPLOY === 'true';
    
    if (isNeocitiesDeploy) {
      // If Neocities is deployed, return the image path
      return `<img src="${imagePath}" alt="" />`;
    } else {
      // If Neocities is not deployed, return the image path with Neocities URL
      const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      const neocitiesUrl = process.env.NEOCITIES_URL || 'https://dakimakura.neocities.org';
      const nekowebUrl = process.env.NEKOWEB_URL || 'https://dakimakura.nekoweb.org';
      
      return `<img src="${neocitiesUrl}/${cleanPath}" 
                   onerror="this.onerror=null; this.src='${nekowebUrl}/${cleanPath}'" 
                   alt="" />`;
    }
  });
  
  // Add neocitiesImage filter
  eleventyConfig.addFilter("neocitiesImage", function(imagePath) {
    if (!imagePath) return "";
    
    // If image path is already an absolute URL, return it
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If image path is a relative path, convert it to an absolute path
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const neocitiesUrl = process.env.NEOCITIES_URL || 'https://dakimakura.neocities.org';
    return `${neocitiesUrl}/${cleanPath}`;
  });
  
  // Add localizedUrl filter
  eleventyConfig.addFilter("localizedUrl", function(url, lang) {
    if (!url) return "";
    if (lang === 'en') return url;
    // If language is not English, return the URL
    return url;
  });
  
  // Add stringify filter
  eleventyConfig.addFilter("stringify", function(obj) {
    return JSON.stringify(obj);
  });
  
  // Add inject-admin-key transform
  eleventyConfig.addTransform("inject-admin-key", function(content, outputPath) {
    if (outputPath && outputPath.endsWith('.html')) {
      // If output path is an HTML file, inject the admin key
      const scriptTag = `<script>
        window.searchConsoleStats = ${JSON.stringify(searchConsoleStats)};
      </script>`;
      return content.replace('</head>', `${scriptTag}\n</head>`);
    }
    return content;
  });

  // Add readableDate filter
  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("dd LLL yyyy");
  });

  // Add htmlDateString filter
  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });

  // Add sortByDate filter
  eleventyConfig.addFilter("sortByDate", function(collection) {
    return collection.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  });

  // Add limit filter
  eleventyConfig.addFilter("limit", function(array, limit) {
    return array.slice(0, limit);
  });

  // Add passthrough copy
  eleventyConfig.addPassthroughCopy("deploy-history.json");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/style.css");
  eleventyConfig.addPassthroughCopy("src/posts.json");
  eleventyConfig.addPassthroughCopy("src/content-data");
  eleventyConfig.addPassthroughCopy("src/uploads");
  eleventyConfig.addPassthroughCopy("neocities.png");


  // HTML minify
  if (process.env.ELEVENTY_ENV === 'production') {
    eleventyConfig.addTransform('htmlmin', async function(content, outputPath) {
      if (outputPath && outputPath.endsWith('.html')) {
        try {
          const minified = await htmlmin.minify(content, {
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyCSS: true,
            minifyJS: true,
            collapseWhitespace: true,
            conservativeCollapse: true,
            preserveLineBreaks: false,
            removeEmptyAttributes: true,
            removeOptionalTags: true,
            removeEmptyElements: false,
            lint: false,
            keepClosingSlash: false,
            caseSensitive: false,
            minifyURLs: true
          });
          return minified;
        } catch (err) {
          console.error('HTML minification failed:', err);
          return content;
        }
      }
      return content;
    });
  }

  return {
    templateFormats: [
      "md",
      "njk",
      "html",
      "liquid"
    ],

    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",

    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },

    // Server options
    serverOptions: {
      port: 8080,
      // API middleware
      middleware: [
        function(req, res, next) {
          if (req.url === '/api/execute-workflow') {
            const executeWorkflow = require('./src/api/execute-workflow');
            return executeWorkflow(req, res);
          }
          next();
        },
        // ContentTools API middleware
        function(req, res, next) {
          if (req.url.startsWith('/api/save-content') || 
              req.url.startsWith('/api/load-content') || 
              req.url.startsWith('/api/content-history') ||
              req.url.startsWith('/api/upload-image') ||
              req.url.startsWith('/api/list-uploads')) {
            const saveContent = require('./src/api/save-content');
            return saveContent(eleventyConfig)(req, res, next);
          }
          next();
        }
      ]
    }
  };
};


