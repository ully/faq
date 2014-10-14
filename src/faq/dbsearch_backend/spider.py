#coding:utf-8
import re
import urllib2
class Spider():
    def __init__(self,strategy,result_file="wiki.txt"):
        self.strategy = strategy
        self.result_file = result_file 
    def parse(self,url):
        response = urllib2.urlopen(url) 
        html = response.read()
        result = []
        for line in html.splitlines(True):
            m = re.match(self.strategy, line)
            if m:
                tuple = (m.group(2),"""发现这个FAQ可能能帮到你:%s 链接 :http://xxx.com/%s 请参考.能解决你的问题，请回复yes,不能请回复no,我让主人帮你解答答。嘻嘻！""" %(m.group(2),m.group(1)))
                result.append(tuple)
        fd = open(self.result_file,"w")
        for tuple in result:
            fd.writelines("%s$$$%s\n" %tuple)
        fd.flush()
        fd.close()