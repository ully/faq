from django.conf.urls.defaults import patterns, include, url
from django.contrib import admin
from faq.settings import STATIC_ROOT

# Uncomment the next two lines to enable the admin:
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    (r'^static/(?P<path>.*)$', 'django.views.static.serve',{'document_root': STATIC_ROOT}),
    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

     url(r'^admin/', include(admin.site.urls)),
    # Uncomment the next line to enable the admin:
    url(r'^assess/', include('faq.assess.urls')),
    url(r'', include('faq.search.urls')),
)
