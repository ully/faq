#coding:utf-8
'''
Created on 2012-11-25

@author: lihan01
'''

from faq.dbsearch_backend.models import IndexLog, InvertedIndex
from faq.search import models
import jieba

class DBQueryProcessor():
    def __init__(self,dict=None):
        if dict:
            jieba.load_userdict(dict)
        self.init_config_data()
        try:
            self.source_id = models.Source.objects.get(name='default').id
        except:
            self.source_id = 0
    
    def init_config_data(self):
        from django.db import connection
        cursor = connection.cursor()
        self.sourcemap ={}
        self.categorymap ={}
        cursor.execute("select id,name from search_source")
        sourcetuple = cursor.fetchall()
        for (source_id,source_name) in sourcetuple:
            self.sourcemap[source_id] = source_name
        cursor.execute("select id,name from search_category")
        categorytuple = cursor.fetchall()
        for (category_id,category_name) in categorytuple:
            self.categorymap[category_id] = category_name
        cursor.close()
            
    def getMatchedQuery(self,query,limit=5,source=None): 
        words = self.get_key_words(query)
        from django.db import connection
        cursor = connection.cursor()
        if source is None:
            query = "SELECT question_id,sum(priority) FROM (SELECT DISTINCT keyword,question_id,priority FROM dbsearch_backend_invertedindex WHERE keyword IN ('%s') UNION SELECT '%s',id,priority FROM search_question WHERE question LIKE '%%%%%s%%%%') t GROUP BY question_id order by sum(priority)  desc limit 50"  %("','".join(words).lower().query,query)
        else:
            if source.find(",") != -1: 
                tempclip = "and source_id in (%s,%s)" %(source,self.source_id)
            else:
                tempclip = "and source_id in (%s,%s)" %(source,self.source_id)
            query = "SELECT question_id,sum(priority) FROM (SELECT DISTINCT keyword,question_id,priority  FROM dbsearch_backend_invertedindex WHERE keyword IN ('%s') %s UNION SELECT '%s',id,500 FROM search_question WHERE question LIKE '%%%%%s%%%%' %s) t GROUP BY question_id order by sum(priority)  desc  limit 50" %("','".join(words).lower(), tempclip,query,query,tempclip)
        cursor.execute(query)
        qidtuples= cursor.fetchall()
        qidmaps={}
        for (id,priorities) in qidtuples:
            qidmaps[str(id)] = priorities
        if not qidmaps:
            cursor.close()
            return ([],words)
        cursor.execute("select id,source_id,question,category_id,answertype,answer,priority from search_question where id in (%s)" %(','.join(qidmaps.keys())))
        questiontuple = cursor.fetchall()
        cursor.close()
        questionlist=[]
        for tuple in questiontuple:
            questiondict={}
            questiondict['id']=str(tuple[0])
            if not self.sourcemap.has_key(tuple[1]):
                self.init_config_data()
            questiondict['source'] = self.sourcemap[tuple[1]]
            questiondict['question'] = tuple[2]
            if not self.categorymap.has_key(tuple[3]):
                self.init_config_data()
            questiondict['category'] = self.categorymap[tuple[3]]
            questiondict['answertype'] = tuple[4]
            questiondict['answer'] = tuple[5]
            extralPriority = self.calculate_distanse(words,tuple[2]);
            questiondict['priority'] = int(tuple[6]+qidmaps[str(tuple[0])]+extralPriority) #keywords优先级之和+问题的优先级
            questionlist.append(questiondict)
        questionlist.sort(cmp=lambda a,b:b['priority']-a['priority'])
        return (questionlist[0:int(limit)],words)

        
    def create_indexes(self,content_list =None):
        if content_list is None :
            questions = models.Question.objects.all()
            content_list = questions
        for q in content_list:
            if not IndexLog.isExist(q):
                try:    
                    self.create_index(q)
                    IndexLog.log(q,True)
                except Exception,e:
                    IndexLog.log(q,False,str(e))
    def get_key_words(self,question):
        keywords = jieba.cut_for_search(question)
        keywordslist = list(keywords)
        if len(keywordslist)!=0:
            return {}.fromkeys(keywordslist).keys()
        else:
            return question
    def create_index(self,q):
        keywords = self.get_key_words(q.question)
        InvertedIndex.save_indexes(keywords,q)
    def calculate_distanse(self,words,question):
        ds ={}
        for word in words:
            wps = findall(word,question)
            for wp in wps:
                if ds.has_key(wp):
                    ds[wp] = ds[wp]+1
                    if ds.has_key(wp+len(word)):
                        ds[wp+len(word)] = ds[wp+len(word)] + 2
                    else:
                        ds[wp+len(word)] = 2
                else:
                    ds[wp] = 1
                    if ds.has_key(wp+len(word)):
                        ds[wp+len(word)] = ds[wp+len(word)] + 2
                    else:
                        ds[wp+len(word)] = 2
        exp = 0 
        for key,value in ds.iteritems():
            if value >=3:
                exp = exp + (value/3)*10
        return exp
def findall(search,text): 
    start = 0
    ps=[]
    while True:
        index = text.find(search, start)
        if index == -1:
            return ps
        ps.append(index)
        start = index + 1

if __name__ == '__main__':
    p = DBQueryProcessor()
#    p.create_indexes()
#     questions =  p.getMatchedQuery(query=u"上线")
#     for q in questions:
#         print q.question
#     print "ok"
    
    
    seg_list = jieba.cut("我来到北京清华大学", cut_all=False)
    print "Default Mode:", "/ ".join(seg_list)  # 精确模式