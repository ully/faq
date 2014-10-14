#coding:utf-8
import jieba


jieba.load_userdict("/home/lihan/workproject/faq/src/faq/dbsearch_backend/icafedict.txt")
seg_list = jieba.cut("蜈支洲岛", cut_all=True)
print "Default Mode:", "/ ".join(seg_list)  # 精确模式