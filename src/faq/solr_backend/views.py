# Create your views here.
from django.shortcuts import render_to_response
from django.template.context import RequestContext


def faq_admin(request):
    return render_to_response( 'admin.html', {},
                                  context_instance = RequestContext( request ) )