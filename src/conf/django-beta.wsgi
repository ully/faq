# -*- coding: utf-8 -*-
import os
import sys
current_dir = os.path.dirname(__file__)
if current_dir not in sys.path:sys.path.append(current_dir)
sys.path = ['/home/work/workdir/apps/faq-beta'] + sys.path
os.environ['DJANGO_SETTINGS_MODULE'] = 'faq.settings'
os.environ['PYTHON_EGG_CACHE'] = '/tmp/.python-eggs'
import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler() #test