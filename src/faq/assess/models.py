from django.contrib import admin
from django.db import models
import datetime

class UserItem(models.Model):
    name = models.CharField(max_length=500)
    description = models.CharField(max_length=500)
    def __unicode__(self):
        return "%s" %(self.name)
    
class UserItemAdmin(admin.ModelAdmin ):
    list_display = ('id' , 'name')
    search_fields = ('id' , 'name')
    class Meta:
        pass
    class Admin:
        pass
admin.site.register( UserItem, UserItemAdmin )
    
class UserData(models.Model):
    item = models.ForeignKey(UserItem)
    likeNum = models.IntegerField(default=0)
    hateNum = models.IntegerField(default=0)
    
    def __unicode__(self):
        return "%s %s (%s %s)" %(self.itemId,self.itemName,self.likeNum,self.hateNum)
    
    @classmethod
    def getAssessData(cls,itemId,username):
        hasAssessed = UserLog.hasAssessed(username, itemId)
        try:
            #data = UserData.objects.raw("select * from assess_userdata where item_id = %s" %itemId)
            data = UserData.objects.get(item = itemId)
            result =  {
                            'likeNum': data.likeNum,
                            'hateNum':data.hateNum,
                            'hasLike': hasAssessed,
                            'hasHate': hasAssessed,
                            }
            return result
        except Exception, e:
            print "get assess data error:%s" %e
            return {'likeNum': 0,
                    'hateNum':0,
                    'hasLike': hasAssessed,
                    'hasHate': hasAssessed,
                    }
        
    @classmethod
    def hate(cls,itemId,username):
        try:
            data = UserData.objects.filter(item = itemId)
            titem = UserItem.objects.get(id=itemId)  
            if len(list(data)) == 0:
                ltem =  UserData(item= titem,likeNum=0,hateNum=1)
                ltem.save()
            else:
                data.update(hateNum=data[0].hateNum + 1)
            UserLog.log(username, titem,False)
        except Exception, e:
            print "add hate fail,error:%s" %e
            pass
    
    @classmethod
    def like(cls,itemId,username):
        try:
            data = UserData.objects.filter(item = itemId)
            titem = UserItem.objects.get(id=itemId)  
            if len(list(data)) == 0:
                ltem =  UserData(item= titem,likeNum=1,hateNum=0)
                ltem.save()
            else:
                data.update(likeNum=data[0].likeNum + 1)
            UserLog.log(username, titem,True)
        except Exception, e:
            print "add like fail,error:%s" %e
            pass

class UserDataAdmin( admin.ModelAdmin ):
    list_display = ('id','item','likeNum','hateNum')
    search_fields = ('id','item','likeNum','hateNum')
    class Meta:
        pass
    class Admin:
        pass
admin.site.register( UserData, UserDataAdmin )


class UserLog(models.Model):
    username = models.CharField(max_length=500,blank=True)
    item = models.ForeignKey(UserItem)
    like = models.BooleanField()
    makedate = models.DateTimeField(auto_now_add=True)
    
    def __unicode__(self):
        return "%s click:%s" %(self.username,self.like)
    @classmethod
    def log(cls,username,item,islike):
        log =  UserLog(username=username,item = item,like= islike, makedate = datetime.datetime.now())
        log.save()
    @classmethod
    def hasAssessed(cls,username,itemId):
        logs =  UserLog.objects.raw("select * from assess_userlog where item_id = %s and username = '%s'" %(itemId,username))
        if len(list(logs)) == 0:
            return False
        else:
            return True
class UserLogAdmin( admin.ModelAdmin ):
    list_display = ('id','username','item','like','makedate')
    search_fields = ('id' ,'username','item')
    class Meta:
        pass
    class Admin:
        pass
admin.site.register( UserLog, UserLogAdmin )
