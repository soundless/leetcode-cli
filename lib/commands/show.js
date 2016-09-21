var _ = require('underscore');
var chalk = require('chalk');
var fs = require('fs');

var sprintf = require('sprintf-js').sprintf;

var config = require('../config');
var core = require('../core');
var h = require('../helper');
var wrap = require('wordwrap')(77);

var cmd = {
  command: 'show <keyword>',
  desc:    'show problem by name or index',
  builder: {
    gen: {
      alias:    'g',
      type:     'boolean',
      describe: 'Generate source file from template'
    },
    dump: {
      alias:    'd',
      type:     'boolean',
      describe: 'Write descriptions & source file from template'
    },
    lang: {
      alias:    'l',
      type:     'string',
      default:  config.LANG,
      describe: 'Program language to use'
    }
  }
};

cmd.handler = function(argv) {
  core.getProblem(argv.keyword, function(e, problem) {
    if (e) return console.log('ERROR:', e);

    var msg = '';
    if (argv.gen) {
      var template = _.find(problem.templates, function(x) {
        return x.value === argv.lang;
      });
      if (!template)
        return console.log('Failed to generate source file: ' +
            'unknown language ' + argv.lang);

      var f = problem.key + h.langToExt(argv.lang);
      fs.writeFileSync(f, template.defaultCode);
      msg = sprintf('(File: %s)', chalk.yellow.underline(f));
    }

    console.log(sprintf('[%d] %s\t%s\n', problem.id, problem.name, msg));
    console.log(sprintf('%s\n', chalk.underline(problem.link)));
    console.log(sprintf('* %s (%.2f%%)', problem.level, problem.percent));
    console.log(sprintf('* Total Accepted: %d', problem.totalAC));
    console.log(sprintf('* Total Submissions: %d\n', problem.totalSubmit));

    var description = wrap(problem.desc.replace(/[\r]/g, '').replace(/[\r\n]{2,}/g, '\n'));

    if (argv.dump) {
        var template = _.find(problem.templates, function(x) {
            return x.value === argv.lang;
        });
        if (!template)
            return console.log('Failed to generate source file: ' +
                    'unknown language ' + argv.lang);

        var f = problem.id + "_" + problem.key;
        var delimiter = '//';
        var header = '';
        var library = '';

        if (argv.lang === 'python' || argv.lang === 'ruby') {
            f += h.langToExt(argv.lang);
            header = sprintf('#!/usr/bin/env %s\n#\n', argv.lang);
            delimiter = '#';
        }
        else if (argv.lang === 'java') {
            if (!fs.existsSync(f)) {
                fs.mkdirSync(f);
            }
            f += '/' + 'Solution' + h.langToExt(argv.lang);
            library = 'import java.util.*;';
        }
        fs.writeFileSync(f, header);
        fs.appendFileSync(f, sprintf('%s [%d] %s\n', delimiter, problem.id, problem.name));
        fs.appendFileSync(f, sprintf('%s %s\n%s\n', delimiter, problem.link, delimiter));
        fs.appendFileSync(f, sprintf('%s * %s (%.2f%%)\n', delimiter, problem.level, problem.percent));
        fs.appendFileSync(f, sprintf('%s * Total Accepted: %d\n', delimiter, problem.totalAC));
        fs.appendFileSync(f, sprintf('%s * Total Submissions: %d\n', delimiter, problem.totalSubmit));
        if (argv.lang === 'python' || argv.lang === 'ruby') {
            fs.appendFileSync(f, '\n' + '# ' + description.split('\n').join('\n' + delimiter + ' '));
        }
        else if (argv.lang === 'java') {
            fs.appendFileSync(f, '\n' + '/* ' + description.split('\n').join('\n' + ' * ') + '\n */\n');
        }
        fs.appendFileSync(f, sprintf('\n%s %s: %s\n', delimiter, "Time  Complexity", "O()"));
        fs.appendFileSync(f, sprintf('%s %s: %s\n\n\n', delimiter, "Space Complexity", "O()"));
        if (library) {
            fs.appendFileSync(f, sprintf('%s\n\n', library));
        }
        fs.appendFileSync(f, template.defaultCode.replace(/[\r\t]/g, ''));
    }
    else {
        console.log(description);
    }
  });
};

module.exports = cmd;
