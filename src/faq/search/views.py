#coding:utf-8
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template.context import RequestContext
from django.utils import simplejson
from faq.search import queryProcessor, models
from faq.search.issueservice import IssueService
from faq.search.models import Question, RequestLog, QuestionHintLog
import time

def search( request ):
    result = {}
    q = request.GET.get('q',None)
    limit = request.GET.get('limit',5)  
    username=request.GET.get('username',None) 
    way = request.GET.get('way',None)
    source= request.GET.get('source',None)
    if way is None:
        result = {'items':[],'keywords':[], 'status':'need way input'}
        return HttpResponse( simplejson.dumps(result),content_type='application/json')
    if q:
        RequestLog.log(way,q,username)
        (rs,words) = queryProcessor.getMatchedQuery(q,limit,source)
#        (rs,words) = queryProcessor.getMatchedQuery(q,limit)
        allsourcemap = queryProcessor.sourcemap
        sourcemap ={}
        if source:
            for k,v in allsourcemap.items():
                if source.find(str(k)) != -1:
                    sourcemap[k] = v
        else:
            sourcemap = allsourcemap
        items=[]
        for r in rs: 
            values = {
             'question_id' : r['id'],
             'question' : r['question'],
             'answer': r['answer'],
             'category':r['category'],
             'source':r['source'],
             'answertype':r['answertype'],
             'rawq': q
            }
            items.append(values)
        result['items'] = items
        result['keywords'] = words
        result['sourcetype'] = sourcemap
        result['status'] = "ok"
    else:
        result = {'items':[],'keywords':[], 'status':'no input query'}
    return HttpResponse( simplejson.dumps(result),content_type='application/json')

def jsonpsearch( request ):
    result = {}
    callback = request.GET.get('jsonpcallback','callback')
    q = request.GET.get('q',None)
    limit = request.GET.get('limit',5) 
    username=request.GET.get('username',None) 
    way = request.GET.get('way',None)
    source= request.GET.get('source',None)
    if way is None:
        result = {'items':[],'keywords':[], ' status':'need way input'}
        return HttpResponse('%s(%s)' % (callback, simplejson.dumps(result)),content_type='text/javascript')
    if q:
        RequestLog.log(way,q,username)
        (rs,words) = queryProcessor.getMatchedQuery(q,limit,source)
#        (rs,words) = queryProcessor.getMatchedQuery(q,limit)
        allsourcemap = queryProcessor.sourcemap
        sourcemap ={}
        if source:
            for k,v in allsourcemap.items():
                if source.find(str(k)) != -1:
                    sourcemap[k] = v
        else:
            sourcemap = allsourcemap
        items=[]
        for r in rs: 
            values = {
             'question_id' : r['id'],
             'question' : r['question'],
             'answer': r['answer'],
             'category':r['category'],
             'source':r['source'],
             'answertype':r['answertype'],
             'rawq': q
            }
            items.append(values)
        result['items'] = items
        result['keywords'] = words
        result['sourcetype'] = sourcemap
        result['status'] = "ok"
    else:
        result = {'items':[],'keywords':[], 'status':'no input query'}
    return HttpResponse('%s(%s)' % (callback, simplejson.dumps(result)),content_type='text/javascript')

def faq_admin(request):
    return render_to_response( 'admin.html', {},
                                  context_instance = RequestContext( request ) )


def get_top_n_question(request):
    result={}
    callback = request.GET.get('jsonpcallback','callback')
    limit = request.GET.get('limit',1)  
    source= request.GET.get('source',None)
    rs = models.TopNQuestion.get_Q(source=source,limit=limit)
    items=[]
    for r in rs:
        value = {
                 'question':r['question'],
                 'answertype':r['answertype'],
                 'answer':r['answer'],
                 }
        items.append(value)
    result['items'] = items
    result['status'] = "ok"
    return HttpResponse('%s(%s)' % (callback, simplejson.dumps(result)),content_type='text/javascript') 

def feedback(request):
    result={}
    callback = request.GET.get('jsonpcallback','callback')
    title= request.GET.get('title',None)
    content= request.GET.get('content',None)
    source= request.GET.get('source',None)
    user= request.GET.get('username',None)
    useremail= request.GET.get('useremail',None)
    issueservice = IssueService()
    ret = issueservice.addCard(user,useremail, source, title, content)
    if ret:
        result['issue'] = ret
        result['status'] = "ok"
    else:
        result['status'] = "fail"
    return HttpResponse('%s(%s)' % (callback, simplejson.dumps(result)),content_type='text/javascript') 

def question_hint(request):
    username= request.GET.get('username',None)
    question= request.GET.get('question',None)
    q= request.GET.get('q',None)
    way= request.GET.get('way',None)
    QuestionHintLog.log(way,q,username,question)
    return HttpResponse() ;
def createindex(request):
    qids = request.GET.get('qids',[])
    isall = request.GET.get('isall','false')
    ret =""
    if qids:
        qids = qids.split(",")
    try:
        if not qids and isall=='false':
            return HttpResponse('qids and isall is null' ,content_type='text/html')
        if qids:
            questions = Question.objects.filter(id__in=qids)
            queryProcessor.create_indexes(list(questions))
            ret ="question(%s) indexes has be created" %qids
        else:
            if isall=="true":
                queryProcessor.create_indexes()
                ret ="all indexes has be created!"
        return HttpResponse('%s' %ret ,content_type='text/html')
    except Exception, e:
        return HttpResponse('create failed,info:%s'%str(e) ,content_type='text/html')
def getScript(request):
    way= request.GET.get('way',None)
    callback = request.GET.get('jsonpcallback','callback')
    script = models.ChannelScript.getScript(way)
    return HttpResponse('%s(%s)' % (callback, simplejson.dumps(script)),content_type='text/javascript') 


