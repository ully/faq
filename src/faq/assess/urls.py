from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns( 
    'faq.assess.views',
   ( r'^init', 'init' ),
   ( r'^like', 'like' ),
   ( r'^hate', 'hate' ),
)
