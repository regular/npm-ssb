# npm-ssb

``` sh
git clone ssb://%imnigwPJY1MbBuvaSGj2CZXjsOqq3LCBCCkxLusLNHQ=.sha256
cd npm-ssb
npm i
bin/npm-ssb&
cd to/whereever/your/package/is
npm publish --registry=http://localhost:9000
```

To stop it again:
```
pgrep npm-ssb | xargs kill
```
