rm *.tgz
rm *.tar.gz
tar cfz code.tar.gz connection.json ../META-INF
tar cfz ccskuproductstockaccount.tgz metadata.json code.tar.gz