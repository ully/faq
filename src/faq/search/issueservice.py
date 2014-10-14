#coding:utf-8
'''
Created on 2013-1-9

@author: xxx
'''
from django.utils import simplejson
from faq import settings
from faq.search import models, queryProcessor
from faq.search.models import Question
import urllib2
class IssueService():
    def __init__(self):
        self.url = settings.issue_url
        self.space_key = settings.feedback_space_key
    def addCard(self,user,useremail,source,title="",content="",isAddIndex =False):
        addcardurl = "%s/space/%s/issue/new" %(self.url,self.space_key)
        owner = None
        system = None
        if source:
            sourceinfos = models.Source.objects.raw("select * from search_source where id in (%s)" %source)
            if len(list(sourceinfos)) > 1:
                owner = sourceinfos[0].owner
            elif len(list(sourceinfos)) == 1:
                owner = sourceinfos[0].owner
                system = sourceinfos[0].description
        if not owner:
            owner = settings.issue_admin
        ownermail = "%s@xx.com" %owner
        data = { "username":settings.issue_admin,
                "password" : settings.issue_admin_password, 
                "issues" : [{
                             "title":title,
                             "detail":content, 
                             "type" : "用户反馈",
                             "fields" : {
                                         "负责人" : owner, 
                                         "提出人":user,
                                         "流程状态" : "待分析",
                                         "所属系统":system
                                         },
                             "notifyEmails" : [useremail,'xxx@xx.com',ownermail]
#                              "notifyEmails" : []
                            }]
                }
        json =  simplejson.dumps(data)
        try:
            request = urllib2.Request(addcardurl, data=unicode(json), headers={'Content-type': 'text/plain;charset=UTF-8'})
            response = urllib2.urlopen(request)
            result = response.read()
            json =  simplejson.loads(result)
            print json
            if json['status'] == 200:
                if isAddIndex and len(title)>=5 and json['failures'] == None:
                    if source !="" and str(source).find(',') ==-1:
                        self.addIndex(title,json['issues'][0]['url'],source)
                    else:
                        self.addIndex(title,json['issues'][0]['url'])
                return json['issues'][0]
            else:
                return None
        except Exception,e:
            print e
            return None
    def addIndex(self,title,answer,source_id=0):
        if source_id == 0:
            s = models.Source.objects.get(name='default')
        else:
            s = models.Source.objects.get(id=source_id)
        c = models.Category.objects.get(name='待分配')
        q = Question(question=title,answertype='URL',source=s,category= c,answer =answer)
        q.save()
        queryProcessor.create_index(q)
        

        