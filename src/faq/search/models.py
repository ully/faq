#coding:utf-8
from django.contrib import admin
from django.db import models
import datetime

# Create your models here.
class Source(models.Model):
    name = models.CharField(max_length=200,unique = True)
    owner = models.CharField(max_length=200)
    description = models.TextField( blank=True)
    def __unicode__(self):
        return self.name
class SourceAdmin( admin.ModelAdmin ):
    list_display = ('id' , 'name','owner','description')
    search_fields = ('id' , 'name','owner','description')
    class Meta:
        pass
    class Admin:
        pass
admin.site.register( Source, SourceAdmin )
    
class Category(models.Model):
    name = models.CharField(max_length=200,unique = True)
    description = models.TextField( blank=True)
    def __unicode__(self):
        return self.name
class CategoryAdmin( admin.ModelAdmin ):
    list_display = ( 'name',)
    search_fields = ( 'name',)
    class Meta:
        pass
    class Admin:
        pass
admin.site.register( Category, CategoryAdmin )
class Question(models.Model):
    ANSWERTYPE_CHOICES = (  
        (u'URL', u'URL'),  
        (u'DIALOG', u'DIALOG'), 
        (u'JS', u'JS'),  
    )  
    source =  models.ForeignKey(Source)  
    question = models.TextField()
    category = models.ForeignKey(Category)
    priority = models.IntegerField(default =50)
    answertype = models.CharField(max_length=20,choices=ANSWERTYPE_CHOICES)
    answer = models.TextField()
    
    def __unicode__(self):
        return self.question
    
class QuestionAdmin( admin.ModelAdmin ):
    list_display = ('id' ,'source','question','answertype','answer')
    search_fields = ('id' , 'question','answertype',)
    class Meta:
        pass
    class Admin:
        pass
admin.site.register( Question, QuestionAdmin )

class RequestLog(models.Model):
    WAY_CHOICES = (  
        (u'ICAFE', u'ICAFE'),  
        (u'HI', u'HI robot'),
        (u'SCM', u'SCM'), 
        (u'pdb', u'pdb'), 
        (u'COODER', u'COODER'),  
    )  
    way =  models.CharField(max_length=20,choices=WAY_CHOICES)
    rawquery = models.TextField(blank=True)
    username = models.CharField(max_length=500,blank=True)
    makedate = models.DateTimeField(auto_now_add=True)
    
    def __unicode__(self):
        return self.rawquery
    @classmethod
    def log(cls,way,q,username):
        templogs = cls.objects.filter(way=way,username=username).order_by("-makedate")
        if len(list(templogs))>0:
            templog = templogs[0]
            if (datetime.datetime.now()-templog.makedate).seconds < 10: 
                lastestlog = cls.objects.filter(id=templog.id)
                lastestlog.update(rawquery=q,makedate = datetime.datetime.now())
                return
        log =  RequestLog(way=way,rawquery=q,username=username,makedate = datetime.datetime.now())
        log.save()
    
class RequestLogQuestionAdmin( admin.ModelAdmin ):
    list_display = ('id' ,'way','rawquery','username','makedate')
    search_fields = ('id' ,'way','rawquery','username')
    class Meta:
        pass
    class Admin:
        pass
admin.site.register( RequestLog, RequestLogQuestionAdmin )

class TopNQuestion(models.Model):
    METHOD_CHOICES = (  
        (u'MANUAL', u'manual add'),  
        (u'AUTO', u'auto add'),  
    ) 

    question =  models.ForeignKey(Question)
    source =  models.ForeignKey(Source)
    method = models.CharField(max_length=20,choices=METHOD_CHOICES)
    
    def __unicode__(self):
        return unicode(self.question)
    
    @classmethod
    def get_Q(cls,source,limit=1):
        if source is None:
            query = "select question_id from search_topnquestion"
        else:
            query = "select question_id from search_topnquestion where source_id in (%s)" %source
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute(query)
        tuple = cursor.fetchall() 
        cursor.close()
        qs = [e[0] for e in tuple]
        import random
        try:
            qlist = random.sample(qs,int(limit))
        except:
            qlist = []
        if not qlist:
            return []
        questions = Question.objects.filter(id__in=qlist)
        questionlist=[]
        for q in list(questions):
            questiondict={}
            questiondict['id']=str(q.id)
            questiondict['question'] = q.question
            questiondict['answertype'] = q.answertype
            questiondict['answer'] =  q.answer
            questiondict['priority'] = int(q.priority)
            questionlist.append(questiondict)
        questionlist.sort(cmp=lambda a,b:b['priority']-a['priority'])
        return questionlist
        
class TopNQuestionAdmin( admin.ModelAdmin ):
    list_display = ('id' ,'source','question','method')
    class Meta:
        pass
    class Admin:
        pass
admin.site.register( TopNQuestion, TopNQuestionAdmin )


class QuestionHintLog(models.Model):
    WAY_CHOICES = (  
        (u'ICAFE', u'ICAFE'),  
        (u'HI', u'HI robot'),
        (u'SCM', u'SCM'),  
    )  
    way =  models.CharField(max_length=20,choices=WAY_CHOICES)
    rawquery = models.TextField(blank=True)
    username = models.CharField(max_length=500,blank=True)
    question = models.ForeignKey(Question)
    makedate = models.DateTimeField(auto_now_add=True)
    
    def __unicode__(self):
        return "%s click:%s" %(self.username,self.question)
    @classmethod
    def log(cls,way,q,username,question):
        log =  QuestionHintLog(way=way,rawquery=q,username=username,question_id = question,makedate = datetime.datetime.now())
        log.save()
    
class QuestionHintLogAdmin( admin.ModelAdmin ):
    list_display = ('id' ,'way','rawquery','question','username','makedate')
    search_fields = ('id' ,'way','rawquery','username')
    class Meta:
        pass
    class Admin:
        pass
admin.site.register( QuestionHintLog, QuestionHintLogAdmin )

class ChannelScript(models.Model):
    WAY_CHOICES = (  
        (u'ICAFE', u'ICAFE'),  
        (u'HI', u'HI robot'),
        (u'SCM', u'SCM'),  
    )  
    way =  models.CharField(max_length=20,choices=WAY_CHOICES)
    script = models.TextField(blank=True)
    
    def __unicode__(self):
        return "%s" %(self.way)
    @classmethod
    def getScript(cls,way):
        scripts = ChannelScript.objects.filter(way= way)
        if len(list(scripts))==0:
            return None
        else:
            return scripts[0].script

    
class ChannelScriptAdmin( admin.ModelAdmin ):
    list_display = ('id' ,'way')
    search_fields = ('id' ,'way')
    class Meta:
        pass
    class Admin:
        pass
admin.site.register( ChannelScript, ChannelScriptAdmin )
