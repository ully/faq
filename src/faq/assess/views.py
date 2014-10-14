# Create your views here.
from django.http import HttpResponse
from faq.assess import models
from django.utils import simplejson
def init(request):
    itemId = request.GET.get("itemId")
    username = request.GET.get("username")
    callback = request.GET.get('jsonpcallback','callback')
    data = models.UserData.getAssessData(itemId, username)
    return HttpResponse('%s(%s)' % (callback, simplejson.dumps(data)),content_type='text/javascript')


def like(request):
    itemId = request.GET.get("itemId")
    username = request.GET.get("username")
    callback = request.GET.get('jsonpcallback','callback')
    models.UserData.like(itemId,username)
    data = models.UserData.getAssessData(itemId, username)
    return HttpResponse('%s(%s)' % (callback, simplejson.dumps(data)),content_type='text/javascript')


def hate(request):
    itemId = request.GET.get("itemId")
    username = request.GET.get("username")
    callback = request.GET.get('jsonpcallback','callback')
    models.UserData.hate(itemId,username)
    data = models.UserData.getAssessData(itemId, username)
    return HttpResponse('%s(%s)' % (callback, simplejson.dumps(data)),content_type='text/javascript')


