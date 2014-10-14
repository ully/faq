from faq.dbsearch_backend.queryprocess import DBQueryProcessor
from faq.settings import PROJECT_PATH
queryProcessor = DBQueryProcessor(dict=PROJECT_PATH+"/dbsearch_backend/dict.txt")