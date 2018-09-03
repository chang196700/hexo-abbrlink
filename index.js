'use strict';

var assign = require('deep-assign');

var hexo = hexo || {};

hexo.config.abbrlink = assign({
    alg: 'crc16',
    rep: 'dec',
    skip_draft: true,
    check: false
}, hexo.config.abbrlink);

hexo.extend.filter.register('before_post_render', require('./lib/logic'), 15);
