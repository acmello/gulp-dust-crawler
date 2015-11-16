'use strict';

// Vars
var _ = require('lodash');
var dust = require('dustjs-linkedin');
dust.helpers = require('dustjs-helpers').helpers;

var commonhelpers = new (require
  ('common-dustjs-helpers').CommonDustjsHelpers
)();
commonhelpers.export_to(dust);

var gutil = require('gulp-util');
var fs = require('fs');
var glob = require('glob');
var beautifyHtml = require('js-beautify').html;
var through = require('through2');

// Consts
var PLUGIN_NAME = 'gulp-dust-crawler';

var gulpDustCrawler = function(options) {
  var pagesPath = options.pages;
  var templatesPath = options.templates;
  var componentsPath = options.components;
  var filtersPath = options.filters;
  var helpersPath = options.helpers;

  // register filters and helpers
  var filtersFiles = glob.sync(filtersPath + '/*.js');
  var helpersFiles = glob.sync(helpersPath + '/*.js');
  _.forEach(filtersFiles, function(filter) {
    require(process.cwd() + '/' + filter)(dust);
  });

  _.forEach(helpersFiles, function(helper) {
    require(process.cwd() + '/' + helper)(dust);
  });

  var jsonTemplatesFiles = glob.sync(templatesPath + '/*.json');
  var jsonTemplates = [];
  var jsonPagesFiles = glob.sync(pagesPath + '/*.json');

  // load globalTemplates
  var globalTemplates = glob.sync(templatesPath + '/*.dust');

  _.forEach(globalTemplates, function(templatePath) {
    var template =  fs.readFileSync(templatePath, 'utf8');
    var templateName = templatePath.split('/').pop().split('.')[0];
    var compiled = dust.compile(template, templateName);
    dust.loadSource(compiled);
  });

  // load Components templates
  var componentTemplates = glob.sync(componentsPath + '/**/*.dust');

  _.forEach(componentTemplates, function(component) {
    var template =  fs.readFileSync(component, 'utf8');
    var templateName = component.split('/').pop().split('.')[0];
    var compiled = dust.compile(template, templateName);
    dust.loadSource(compiled);
  });

  // Init components JSON
  var jsonComponentsFiles = glob.sync(componentsPath + '/**/*.json');
  var jsonComponents = {'components': {}};

  _.forEach(jsonComponentsFiles, function(component) {
    var parsed = JSON.parse(fs.readFileSync(component, 'utf8'));
    var componentName = component.split('/').pop().split('.')[0];
    jsonComponents.components[componentName] = parsed;
  });

  // Init templates JSON
  _.forEach(jsonTemplatesFiles, function(template) {
    var parsed = JSON.parse(fs.readFileSync(template, 'utf8'));
    _.merge(jsonTemplates, parsed);
  });

  return through.obj(function(file, encode, callback) {
    try {
      var templateCode = file.contents.toString(encode || 'utf8');
      var that = this;
      var jsonData = jsonTemplates;
      var componentData = jsonComponents;

      var dustRender = function(code, templateName, data, path) {
        var compiled = dust.compile(code, templateName);
        dust.loadSource(compiled);
        dust.render(templateName, data, function(err, output) {
          var tempFile = new gutil.File({
            base: file.base,
            cwd: file.cwd,
            path: path,
          });

          tempFile.contents = new Buffer(beautifyHtml(output));
          that.push(tempFile);
        });
      };

      // Get pages
      _.forEach(jsonPagesFiles, function(page) {
        var pageName = page.split('/').pop().split('.')[0];
        var parsed = JSON.parse(fs.readFileSync(page, 'utf8'));

        _.merge(jsonData, _.omit(parsed, 'components'));

        if (parsed.components) {
          _.merge(componentData.components, parsed.components);
        }

        // Get sports
        var jsonSportFile = glob.sync(pagesPath + '/' + pageName + '/*.json');
        _.forEach(jsonSportFile, function(sport) {
          var sportName = sport.split('/').pop().split('.')[0];
          var parsed = JSON.parse(fs.readFileSync(sport, 'utf8'));

          // pode haver problemas aqui - VER DEPOIS
          var sportData = _.omit(parsed, 'pageState');
          _.merge(jsonData, _.omit(sportData, 'components'));

          if (parsed.components) {
            _.merge(componentData.components, parsed.components);
          }

          // get pagestate
          if (parsed.pageState) {
            _.forEach(parsed.pageState, function(state) {
              var stateData = _.omit(state, 'components');
              var stateWithoutPhase = _.omit(stateData, 'phases');
              _.merge(jsonData, {pageState: state.name});
              _.merge(jsonData, _.omit(stateWithoutPhase, 'name'));

              if (state.components) {
                _.merge(componentData.components, state.components);
              }

              // get phases
              if (state.phases) {

                var allPhases = [];
                _.forEach(state.phases, function(phase) {
                  allPhases = allPhases.concat(_.omit(phase, 'components'));
                });

                jsonData.phases = allPhases;
              }

              if (state.gameFormat) {
                _.forEach(state.gameFormat, function(format) {
                  _.merge(jsonData, _.omit(format, 'components'));
                  if (format.components) {
                    _.merge(componentData.components, format.components);
                  }

                  // get phases
                  if (format.phases) {
                    var allPhases = [];

                    _.forEach(format.phases, function(insidePhase) {
                      allPhases = allPhases
                        .concat(_.omit(insidePhase, 'components'));
                    });

                    jsonData.phases = allPhases;
                  }

                  var finalData = _.extend({}, jsonData, componentData);
                  dustRender(
                    templateCode,
                    pageName,
                    finalData,
                    file.path.replace('.dust', '.html')
                    .replace(
                      pageName,
                      pageName +
                        '/' + sportName + '-' + format.name + '--' + state.name
                    )
                  );
                });
              } else {
                var finalData = _.extend({}, jsonData, componentData);
                dustRender(
                  templateCode,
                  pageName,
                  finalData,
                  file.path.replace('.dust', '.html')
                  .replace(
                    pageName,
                    pageName + '/' + sportName + '--' + state.name
                  )
                );
              }
            });
          }
        });
      });

      return callback();

    } catch (err) {
      return callback(new gutil.PluginError('gulp-dust-crawler', err, options));
    }

    callback(null, file);
  });
};

module.exports = gulpDustCrawler;
