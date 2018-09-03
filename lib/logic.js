'use strict';

var crc16 = require('./crc16');
var crc32 = require('./crc32');
var front = require('hexo-front-matter');
var fs = require('hexo-fs');
var model = require('./model');
var moment = require('moment');

var reg_org = /.*\.org/

var str_format = 'YYYY-MM-DD HH:mm:ss'

function org_get_abbrlink(data) {
    var r = data.content.match(/#\+ABBRLINK:.*\n/);
    var d = data.content.match(/#\+DATE:.*\n/);

    if (r) {
        data.abbrlink = r[0].split(':')[1].trim();
    }
    else {
        data.abbrlink = ''
    }

    if (d) {
        data.date = d[0].split(':')[1].trim();
    } else {
        date.date = gen_date();
    }

    return data
}

function gen_abbrlink(msg, alg, rep) {
    let res = (alg == 'crc32' ? crc32.str(msg) >>> 0 : crc16(msg) >>> 0)
    let abbrlink = model.check(res);
    abbrlink = rep == 'hex' ? abbrlink.toString(16) : abbrlink;
    return abbrlink;
}

function gen_date(date) {
    if (date)
    {
        return moment(date, str_format);
    } else {
        return new moment();
    }
}

function write_abbrlink(raw, abbrlink, date, path) {
    let tmpPost = front.parse(raw);
    if (abbrlink) {
        tmpPost.abbrlink = abbrlink;
    } else if (tmpPost.abbrlink) {
        delete tmpPost.abbrlink;
    }
    if (date) {
        tmpPost.date = date.format(str_format);
    } else if (tmpPost.date) {
        delete tmpPost.date
    }
    let tmpStr = front.stringify(tmpPost, {
        prefixSeparator: true
    });
    fs.writeFileSync(path, tmpStr, 'utf-8');
}

let logic = function (data) {
    var log = this.log;
    if (data.layout == 'post') {
        var config = this.config.abbrlink;

        // Skip draft
        if (config.skip_draft && !data.published) {
            log.i("Skip %s", data.full_source);
            if (data.abbrlink && !reg_org.test(data.source)) {
                write_abbrlink(data.raw, null, null, data.full_source);
            }
            return data;
        }

        let abbrlink
        if (!reg_org.test(data.source)) {
            abbrlink = data.abbrlink;
        } else {
            abbrlink = org_get_abbrlink(data).abbrlink
        }

        if (config.check || !abbrlink) {
            let date
            
            if (!data.date) {
                data.date = gen_date();
            }
            date = data.date;
            
            abbrlink = gen_abbrlink(date.format(str_format), config.alg, config.rep);

            if (config.check && abbrlink == data.abbrlink) {
                return data;
            }

            data.abbrlink = abbrlink;
            let postStr;
            if (!reg_org.test(data.source)) {
                write_abbrlink(data.raw, abbrlink, date, data.full_source);
            } else {
                let raw = data.raw.replace(/#\+ABBRLINK:.*\n/, '');
                raw = raw.replace(/#\+DATE:.*\n/, '');
                postStr = raw.split("\n")
                postStr.splice(2, 0, '#+ABBRLINK: ' + abbrlink)
                postStr.splice(3, 0, '#+DATE: ' + date)
                fs.writeFileSync(data.full_source, postStr.join('\n'), 'utf-8');
            }

            log.i("Generate link %s for post [%s]", abbrlink, data.title);
        }
        model.add(abbrlink);
    }
    return data
}



module.exports = logic;
