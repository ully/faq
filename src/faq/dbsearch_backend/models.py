from django.contrib import admin
from django.db import models
from faq.search.models import Question, Source
import datetime

# Create your models here.
class InvertedIndex(models.Model):
    keyword =  models.CharField(max_length=200, db_index = True)
    question =  models.ForeignKey(Question)
    source =  models.ForeignKey(Source)  
    priority = models.IntegerField(default =50)
    def __unicode__(self):
        return unicode(self.question)
    
    @classmethod
    def save_indexes(cls,keywords,question):
        for keyword in keywords:
            index = InvertedIndex(keyword=keyword.lower(),question=question,source=question.source)
            index.save()
class InvertedIndexAdmin( admin.ModelAdmin ):
    list_display = ( 'id' ,'keyword','question')
    search_fields = ('id' , 'keyword')
    class Meta:
        pass
    class Admin:
        pass
admin.site.register( InvertedIndex, InvertedIndexAdmin )

class IndexLog(models.Model):
    question =  models.ForeignKey(Question)
    status = models.BooleanField(default = False)
    info = models.TextField( blank=True)
    processdate = models.DateTimeField(auto_now_add=True)
    def __unicode__(self):
        return unicode(self.question)
    @classmethod
    def log(cls,question,status,info=''):
        indexlog = IndexLog(question=question,status=status,info=info,processdate = datetime.datetime.now())
        indexlog.save()
    @classmethod
    def isExist(cls,q):
        logs = IndexLog.objects.filter(question=q)
        print logs.query
        return len( logs ) > 0
    
class IndexLogAdmin( admin.ModelAdmin ):
    list_display = ( 'id' ,'question','processdate')
    class Meta:
        pass
    class Admin:
        pass
admin.site.register( IndexLog, IndexLogAdmin )