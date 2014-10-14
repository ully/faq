/**
 * @“赞”&“踩”功能实现
 */
var test = {};
test.initInterface = {
    likeNum: 0,
    hateNum:0,
    hasLike: false,
    hasHate: false
};
test.likeInterface = {
    likeNum:0,
    hateNum:0,
    hasLike: true,
    hasHate: true
};
test.hateInterface = {
    likeNum: 0,
    hateNum:0,
    hasLike: true,
    hasHate: true
};

!function ($) {
    var like, globalData;
    like = function (option) {
        this.option = this.option || {};
        $.extend(true, this.option, option);
        this.init();
    };

    $.extend(true, like.prototype, {
        gid: null,
        option: null,
        $target: null,
        dataId: null,
        $element: null,
        likeInterface: null,
        hateInterface: null,
        initInterface: null,
        commentInterface: null,
        init: function() {
            var me = this,
                option = me.option;
            me.$target = option.target;
            me.likeInterface = option.likeInterface;
            me.hateInterface = option.hateInterface;
            me.initInterface = option.initInterface;
            me.commentInterface = option.commentInterface;
            me.position = option.position;

            me.refresh('init');
        },
        refresh: function(init, xhr) {
            var me = this, initDataConfig;

            //非初始化的调用此方法
            if(!init) {
                me.build(xhr);
                return;
            }

            //请求数据，初始化
            /*initDataConfig = {
                url: me.initInterface,
                dataType: 'jsonp',
                success: $.proxy(me.build, me),
                error: function() {
                    me.build.call(me, test.initInterface);
                }
            };*/
            $.getScript(me.initInterface, function () {
                me.build.call(me, globalData);
            });
            //$.ajax(initDataConfig);
        },
        build: function(xhr) {
            var me = this,
                html = [],
                likeNum = 0,
                hateNum = 0,
                hasLike = '',
                hasHate = '',
                likeTitle = '',
                hateTitle = '',
                targetPosition = me.$target.css('position'),
                data = xhr,
                stopEvaluate = '',
                position = '';
            if(typeof xhr !== 'object') return;

            me.$target.data('like', null);
            me.$element && me.$element.remove();

            //TODO likeNum,hateNum,hasLike,hasHate

            likeNum = data.likeNum;
            hateNum = data.hateNum;
            hasLike = data.hasLike ? ' hasLike' : '';
            hasHate = data.hasHate ? ' hasHate' : '';
            likeTitle = data.hasLike || data.hasHate ? '已评价' : '赞一个';
            hateTitle = data.hasLike || data.hasHate ? '已评价' : '踩一个';
            (data.hasLike || data.hasHate) && (stopEvaluate = ' stop');

            for(var i in me.position) {
                position += ('' + i + ':' + me.position[i] + 'px;');
            }
            !position && (position = 'right:3px;bottom:3px;');

            html.push('<div class="like-wrapper clearfix" style="position:absolute;' + position + '">');

            html.push('<div class="like">');
            html.push('<a href="javascript:;" class="like' + hasLike + stopEvaluate + '" title="' + likeTitle + '">赞</a>');
            html.push('<span class="like-num">(' + likeNum + ')</span>');
            html.push('</div>');

            html.push('<div class="hate">');
            html.push('<a href="javascript:;" class="hate' + hasHate + stopEvaluate + '" title="' + hateTitle + '">踩</a>');
            html.push('<span class="hate-num">(' + hateNum + ')</span>');
            html.push('</div>');

            html.push('<div class="comment hidden" style="display:none;">');//TODO 暂时不要评论功能，故设置为hidden
            html.push('<a class="close-comment">x</a>');
            html.push('<textarea></textarea>');
            html.push('<a class="submit-comment">评论</a>');
            html.push('</div>');

            html.push('</div>');

            html = $(html.join(''));

            if(targetPosition === 'static') {
                //me.$target.css('position', 'relative');
            }
            //me.$target.append(html);
            $(document.body).append(html);
            me.$target.data('like', html);
            me.$element = html;

            me.bindActions();
        },
        bindActions: function() {
            var me = this;
            me.$element.click(function(e) {
                var target = $(e.target || e.srcElement);
                if(target.hasClass('stop') || target.hasClass('hasLike') || target.hasClass('hasHate') || target[0].tagName.toLowerCase() !== 'a') {
                    return;
                }
                if(target.hasClass('like')) {
                    me.likeOrHate(true);
                } else if(target.hasClass('hate')) {
                    me.likeOrHate();
                } else if(target.hasClass('submit-comment')) {
                    var tx = me.$element.find('div.comment textarea'),
                        value = $.trim(tx.val()),
                        ajaxConfig;
                    if(!value) return;
                    /*ajaxConfig = {
                        url: me.commentInterface,
                        dataType: 'jsonp',
                        data: {comment: value},
                        success: function(xhr) {
                            me.refresh(false, xhr);
                        },
                        error: function() {
                            me.refresh(false, test.likeInterface);
                        }
                    };*/
                }
            });
        },
        likeOrHate: function(like) {
            var me = this,
                ajaxConfig,
                url = like ? me.likeInterface : me.hateInterface;
            /*ajaxConfig = {
                url: url,
                dataType: 'jsonp',
                success: function(xhr) {
                    me.refresh(false, xhr);
                },
                error: function() {
                    if(like) {
                        me.refresh(false, test.likeInterface);
                    } else {
                        me.refresh(false, test.hateInterface);
                    }
                }
            };
            $.ajax(ajaxConfig);*/
            $.getScript(url, function () {
                me.refresh.call(me, false, globalData);
            });
        }
    });

    $.like = like;

    $.fn.like = function(option) {
        if(!this.length) return;
        option = $.extend(true, {target: this}, option);
        new like(option);
    };

    /*全局变量,jsonp的回调*/
    callback = function (data) {
        globalData = data;
    };

}(window.jQuery);
