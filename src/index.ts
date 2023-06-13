#!/usr/bin/env node

import app from './app';

app()
  .then(() => {
    console.log('Success.');
    process.exitCode = 0;
  })
  .catch((e) => {
    console.error('Failure.', e);
    process.exitCode = 1;
  });
