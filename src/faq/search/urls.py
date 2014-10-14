from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns( 
    'faq.search.views',
    ( r'^$', 'faq_admin' ),
   ( r'^search', 'search' ),
   ( r'^jsonpsearch', 'jsonpsearch' ),
   ( r'^faqadmin', 'faq_admin' ),
   ( r'^createindex', 'createindex' ),
   ( r'^gettopq', 'get_top_n_question' ),
   ( r'^feedback', 'feedback' ),
   ( r'^qhint', 'question_hint' ),
   ( r'^getscript', 'getScript' ),
 #  ( r'^asp_prerelease_mock', 'asp_prerelease_mock' ),
 #  ( r'^asp_release_mock', 'asp_release_mock' ),
)
