#!/bin/sh
cd ..
tar zcf faq.tar.gz faq/
cd faq
rm -rf output
mkdir -p output 
cp ../faq.tar.gz output/
