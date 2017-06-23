DEBUG=* bin/npm-ssb-dry-run&
pushd test/fixtures/hello-world
npm publish --registry=http://localhost:9000
popd
pgrep npm-ssb|xargs kill
